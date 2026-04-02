import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JWTPayload } from '@/core/jwt/jwt.interface';
import { NotificationType } from '@/lib/firebase/dto/fireabse-notification.dto';
import { MailService } from 'src/lib/mail/mail.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { FirebaseNotificationService } from '../firebase-notification/firebase-notification.service';
import { UserRegistration } from '../socketio-notification/interface/events-payload';
import { EVENT_TYPES } from '../socketio-notification/interface/events.name';

// ===================== TYPE DEFINITIONS =====================
interface PayloadForSocketClient {
  sub: string;
  email: string;
  userUpdates?: boolean;
  serviceCreate?: boolean;
  review?: boolean;
  post?: boolean;
  message?: boolean;
  userRegistration?: boolean;
  inquiry?: boolean;
  follow?: boolean;
  uploadProof?: boolean;
  paymentReminder?: boolean;
  orderUpdate?: boolean;
  newOrder?: boolean;
  serviceRequestAccepted?: boolean;
  serviceRequestRejected?: boolean;
  paymentSuccessful?: boolean;
  paymentFailed?: boolean;
  inquiryResponse?: boolean;
  reviewReceived?: boolean;
  postCreated?: boolean;
  postLiked?: boolean;
  postCommented?: boolean;
  postShared?: boolean;
  postReplied?: boolean;
  donationReceived?: boolean;
  communityCreated?: boolean;
  communityJoined?: boolean;
}

interface SocketNotification {
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  meta: Record<string, any>;
}

interface ServiceEvent {
  info: {
    serviceName: string;
    description?: string;
    authorId: string;
    publishedAt?: Date;
    recipients: { id: string; email: string }[];
  };
  meta?: Record<string, any>;
}

// ===================== GATEWAY =====================
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notification',
})
@Injectable()
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);
  private readonly clients = new Map<string, Set<Socket>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly firebaseNotificationService: FirebaseNotificationService,
    private readonly mailService: MailService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log(
      'Socket.IO server initialized for Notification Gateway',
      server.adapter.name,
    );
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) return client.disconnect(true);

      const payload = this.jwtService.verify<JWTPayload>(token, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      });

      if (!payload.sub) return client.disconnect(true);

      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) return client.disconnect(true);

      // --------------------- Ensure the user has a NotificationToggle record ---------------------
      let notificationToggle =
        await this.prisma.client.notificationToggle.findFirst({
          where: { userId: user.id },
        });

      if (!notificationToggle) {
        notificationToggle = await this.prisma.client.notificationToggle.create(
          {
            data: { userId: user.id },
          },
        );
      }

      const payloadForSocketClient: PayloadForSocketClient = {
        sub: user.id,
        email: user.email,
        userUpdates: notificationToggle?.userUpdates || false,
        serviceCreate: notificationToggle?.serviceCreate || false,
        review: notificationToggle?.review || false,
        post: notificationToggle?.post || false,
        message: notificationToggle?.message || false,
        userRegistration: notificationToggle?.userRegistration || false,
        inquiry: notificationToggle?.inquiry || false,
        follow: notificationToggle?.follow || false,
        uploadProof: notificationToggle?.uploadProof || false,
        paymentReminder: notificationToggle?.paymentReminder || false,
        orderUpdate: notificationToggle?.orderUpdate || false,
        newOrder: notificationToggle?.newOrder || false,
        serviceRequestAccepted:
          notificationToggle?.serviceRequestAccepted || false,
        serviceRequestRejected:
          notificationToggle?.serviceRequestRejected || false,
        paymentSuccessful: notificationToggle?.paymentSuccessful || false,
        paymentFailed: notificationToggle?.paymentFailed || false,
        inquiryResponse: notificationToggle?.inquiryResponse || false,
        reviewReceived: notificationToggle?.reviewReceived || false,
        postCreated: notificationToggle?.postCreated || false,
        postLiked: notificationToggle?.postLiked || false,
        postCommented: notificationToggle?.postCommented || false,
        postShared: notificationToggle?.postShared || false,
        postReplied: notificationToggle?.postReplied || false,
        donationReceived: notificationToggle?.donationReceived || false,
        communityCreated: notificationToggle?.communityCreated || false,
        communityJoined: notificationToggle?.communityJoined || false,
      };

      client.data.user = payloadForSocketClient;
      this.subscribeClient(user.id, client);

      this.logger.log(`Client connected: ${user.id}`);
    } catch (err: any) {
      this.logger.warn(`JWT verification failed: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.sub;
    if (userId) {
      this.unsubscribeClient(userId, client);
      this.logger.log(`Client disconnected: ${userId}`);
    } else {
      this.logger.log('Client disconnected: unknown user');
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader =
      client.handshake.headers.authorization || client.handshake.auth?.token;
    if (!authHeader) return null;
    return authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;
  }

  private subscribeClient(userId: string, client: Socket) {
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)!.add(client);
    this.logger.debug(`Subscribed client to user ${userId}`);
  }

  private unsubscribeClient(userId: string, client: Socket) {
    const set = this.clients.get(userId);
    if (!set) return;

    set.delete(client);
    this.logger.debug(`Unsubscribed client from user ${userId}`);
    if (set.size === 0) this.clients.delete(userId);
  }

  public getClientsForUser(userId: string): Set<Socket> {
    return this.clients.get(userId) || new Set();
  }

  /**
   * ==================== UNIFIED NOTIFICATION SAVE ====================
   * Saves notification to database for ONE recipient
   */
  private async saveNotificationToDatabase(
    userId: string,
    title: string,
    message: string,
    metadata: Record<string, any>,
    notificationType: string,
  ): Promise<string | null> {
    try {
      const notification = await this.prisma.client.notification.create({
        data: {
          title,
          type: notificationType,
          message,
          meta: metadata,
        },
      });

      // Create UserNotification mapping
      await this.prisma.client.userNotification.create({
        data: {
          userId,
          notificationId: notification.id,
          read: false,
        },
      });

      this.logger.log(`Notification saved to DB for user ${userId}`);
      return notification.id;
    } catch (error: any) {
      this.logger.error(
        `Error saving notification to database: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * ==================== UNIFIED NOTIFICATION SEND ====================
   * Sends notification via Socket.IO and optionally Firebase
   */
  private async sendNotificationToUser(
    userId: string,
    socketNotification: SocketNotification,
    firebaseData?: {
      title: string;
      body: string;
      type: NotificationType;
      data: Record<string, string>;
    },
  ): Promise<void> {
    // Check if user has this notification type enabled
    const toggle = await this.prisma.client.notificationToggle.findFirst({
      where: { userId },
    });

    if (!toggle) {
      this.logger.warn(`No notification toggle found for user ${userId}`);
      return;
    }

    // Map notification type to toggle field
    const notificationTypeMap: Record<string, keyof typeof toggle> = {
      [EVENT_TYPES.USERREGISTRATION_CREATE]: 'userRegistration',
      [EVENT_TYPES.SERVICE_CREATE]: 'serviceCreate',
      [EVENT_TYPES.INQUIRY_CREATE]: 'inquiry',
      [EVENT_TYPES.SERVICE_REQUEST_ACCEPTED]: 'serviceRequestAccepted',
      [EVENT_TYPES.SERVICE_REQUEST_DECLINED]: 'serviceRequestRejected',
    };

    const toggleField = notificationTypeMap[socketNotification.type];
    if (toggleField && !toggle[toggleField]) {
      this.logger.log(
        `User ${userId} has disabled ${socketNotification.type} notifications`,
      );
      return;
    }

    // Send via Socket.IO
    const clients = this.getClientsForUser(userId);
    if (clients.size > 0) {
      clients.forEach((client) => {
        client.emit(socketNotification.type, socketNotification);
        this.logger.log(
          `Socket notification sent to ${userId} via socket ${client.id}`,
        );
      });
    } else {
      this.logger.warn(`No active socket connections for user ${userId}`);
    }

    // Send via Firebase if data provided
    if (firebaseData) {
      try {
        await this.firebaseNotificationService.sendToUser(
          userId,
          firebaseData,
          false,
        );
        this.logger.log(`Firebase notification sent to ${userId}`);
      } catch (error: any) {
        this.logger.error(
          `Failed to send Firebase notification: ${error.message}`,
        );
      }
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong');
  }

  @SubscribeMessage(EVENT_TYPES.USERREGISTRATION_CREATE)
  handlePostUpdate(purpose: string, client: Socket) {
    client.broadcast.emit(purpose, {});
  }

  // ======= LISTEN TO USER REGISTRATION EVENT =======
  @OnEvent(EVENT_TYPES.USERREGISTRATION_CREATE)
  async handleUserRegistrationCreated(payload: UserRegistration) {
    this.logger.log('User Registration EVENT RECEIVED');
    this.logger.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

    if (!payload.info?.recipients?.length) {
      this.logger.warn('No recipients found → skipping');
      return;
    }

    this.logger.log(`Total recipients: ${payload.info.recipients.length}`);

    for (const recipient of payload.info.recipients) {
      try {
        this.logger.log(
          `--- Processing recipient: ${recipient.id} (${recipient.email}) ---`,
        );

        const notificationData: SocketNotification = {
          type: EVENT_TYPES.USERREGISTRATION_CREATE,
          title: 'New User Registered',
          message: `${payload.info.name} has registered as ${payload.info.role}`,
          createdAt: new Date(),
          meta: {
            id: payload.info.id,
            email: payload.info.email,
            name: payload.info.name,
            role: payload.info.role,
            ...payload.meta,
          },
        };

        // SAVE TO DATABASE (Single save)
        await this.saveNotificationToDatabase(
          recipient.id,
          notificationData.title,
          notificationData.message,
          notificationData.meta,
          'UserRegistration',
        );

        // SEND VIA SOCKET AND FIREBASE
        await this.sendNotificationToUser(recipient.id, notificationData, {
          title: notificationData.title,
          body: notificationData.message,
          type: NotificationType.NEW_FOLLOWER,
          data: {
            userId: payload.info.id,
            name: payload.info.name,
            email: payload.info.email,
          },
        });

        this.logger.log(`✔ Notification processed for ${recipient.id}`);
      } catch (error: any) {
        this.logger.error(
          `Error processing recipient ${recipient.id}: ${error.message}`,
        );
      }
    }

    this.logger.log('USERREGISTRATION_CREATE event processing complete');
  }

  // ======= LISTEN TO SERVICE CREATE EVENT =======
  @OnEvent(EVENT_TYPES.SERVICE_CREATE)
  async handleServiceCreated(payload: ServiceEvent) {
    this.logger.log('SERVICE_CREATE EVENT RECEIVED');
    this.logger.debug(JSON.stringify(payload, null, 2));

    if (!payload.info?.recipients?.length) {
      this.logger.warn('No recipients found for SERVICE_CREATE');
      return;
    }

    for (const recipient of payload.info.recipients) {
      try {
        const socketPayload: SocketNotification = {
          type: EVENT_TYPES.SERVICE_CREATE,
          title: 'New Service Created',
          message: `${payload.info.serviceName} has been created.`,
          createdAt: new Date(),
          meta: {
            ...payload.meta,
            serviceName: payload.info.serviceName,
            userId: payload.info.authorId,
          },
        };

        // SAVE TO DATABASE (Single save)
        await this.saveNotificationToDatabase(
          recipient.id,
          socketPayload.title,
          socketPayload.message,
          socketPayload.meta,
          'service',
        );

        // SEND VIA SOCKET AND FIREBASE
        await this.sendNotificationToUser(recipient.id, socketPayload, {
          title: socketPayload.title,
          body: socketPayload.message,
          type: NotificationType.SERVICE_UPDATE,
          data: {
            serviceName: payload.info.serviceName,
            userId: payload.info.authorId,
          },
        });

        this.logger.log(`Notification processed for ${recipient.id}`);
      } catch (error: any) {
        this.logger.error(
          `Error processing recipient ${recipient.id}: ${error.message}`,
        );
      }
    }

    this.logger.log('SERVICE_CREATE event processing complete');
  }

  // ======= LISTEN TO INQUIRY CREATE EVENT =======
  @OnEvent(EVENT_TYPES.INQUIRY_CREATE)
  async handleInquiryCreated(payload: any) {
    this.logger.log('INQUIRY_CREATE EVENT RECEIVED');
    this.logger.debug(JSON.stringify(payload, null, 2));

    if (!payload.info?.recipients?.length) {
      this.logger.warn('No recipients found for INQUIRY_CREATE');
      return;
    }

    for (const recipient of payload.info.recipients) {
      try {
        const notificationData: SocketNotification = {
          type: EVENT_TYPES.INQUIRY_CREATE,
          title: 'New Inquiry Received',
          message:
            payload.info.message ||
            `${payload.info.username} sent you an inquiry about their service`,
          createdAt: new Date(),
          meta: {
            inquirerId: payload.info.id,
            inquirerEmail: payload.info.email,
            inquirerName: payload.info.name,
            inquirerRole: payload.info.role,
            ...payload.meta,
          },
        };

        // SAVE TO DATABASE (Single save)
        await this.saveNotificationToDatabase(
          recipient.id,
          notificationData.title,
          notificationData.message,
          notificationData.meta,
          'inquiry',
        );

        // SEND VIA SOCKET AND FIREBASE
        await this.sendNotificationToUser(recipient.id, notificationData, {
          title: notificationData.title,
          body: notificationData.message,
          type: NotificationType.NEW_MESSAGE,
          data: {
            inquirerId: payload.info.id,
            inquirerName: payload.info.name,
            inquirerEmail: payload.info.email,
          },
        });

        this.logger.log(`Notification processed for ${recipient.id}`);
      } catch (error: any) {
        this.logger.error(
          `Error processing recipient ${recipient.id}: ${error.message}`,
        );
      }
    }

    this.logger.log('INQUIRY_CREATE event processing complete');
  }

  // ======= LISTEN TO SERVICE REQUEST ACCEPTED EVENT =======
  @OnEvent(EVENT_TYPES.SERVICE_REQUEST_ACCEPTED)
  async handleServiceRequestAccepted(payload: any) {
    this.logger.log('SERVICE_REQUEST_ACCEPTED EVENT RECEIVED');
    this.logger.debug(JSON.stringify(payload, null, 2));

    if (!payload.info) {
      this.logger.warn('No info found for SERVICE_REQUEST_ACCEPTED');
      return;
    }

    try {
      const buyerId = payload.info.buyerId;
      const notificationData: SocketNotification = {
        type: EVENT_TYPES.SERVICE_REQUEST_ACCEPTED,
        title: 'Service Request Accepted',
        message: `${payload.info.sellerName} has accepted your service request for "${payload.info.serviceName}"`,
        createdAt: new Date(),
        meta: {
          serviceRequestId: payload.info.serviceRequestId,
          serviceId: payload.info.serviceId,
          serviceName: payload.info.serviceName,
          sellerId: payload.info.sellerId,
          sellerName: payload.info.sellerName,
          status: 'ACCEPTED',
          ...payload.meta,
        },
      };

      // SAVE TO DATABASE (Single save)
      await this.saveNotificationToDatabase(
        buyerId,
        notificationData.title,
        notificationData.message,
        notificationData.meta,
        'service',
      );

      // SEND EMAIL NOTIFICATION
      try {
        const buyer = await this.prisma.client.user.findUnique({
          where: { id: buyerId },
          select: { email: true, name: true },
        });

        if (buyer?.email) {
          await this.mailService.sendMail({
            to: buyer.email,
            subject: 'Service Request Accepted',
            html: `
                        <p>Hello ${buyer.name || 'Buyer'},</p>
                        <p><strong>${payload.info.sellerName}</strong> has accepted your service request for <strong>"${payload.info.serviceName}"</strong>.</p>
                        <p>You can now proceed with the next steps of your request.</p>
                        <p>Thank you,<br/>DaConnect Team</p>
                        `,
            text: `Service Request Accepted: ${payload.info.sellerName} has accepted your service request for "${payload.info.serviceName}".`,
          });
          this.logger.log(`Email notification sent to buyer ${buyerId}`);
        }
      } catch (emailError: any) {
        this.logger.error(
          `Failed to send email notification: ${emailError.message}`,
        );
      }

      // SEND VIA SOCKET AND FIREBASE
      await this.sendNotificationToUser(buyerId, notificationData, {
        title: notificationData.title,
        body: notificationData.message,
        type: NotificationType.SERVICE_REQUEST_ACCEPTED,
        data: {
          serviceRequestId: payload.info.serviceRequestId,
          sellerId: payload.info.sellerId,
          sellerName: payload.info.sellerName,
          serviceName: payload.info.serviceName,
          status: 'ACCEPTED',
        },
      });

      this.logger.log('SERVICE_REQUEST_ACCEPTED event processing complete');
    } catch (error: any) {
      this.logger.error(
        `Error processing SERVICE_REQUEST_ACCEPTED event: ${error.message}`,
      );
    }
  }

  // ======= LISTEN TO SERVICE REQUEST DECLINED EVENT =======
  @OnEvent(EVENT_TYPES.SERVICE_REQUEST_DECLINED)
  async handleServiceRequestDeclined(payload: any) {
    this.logger.log('SERVICE_REQUEST_DECLINED EVENT RECEIVED');
    this.logger.debug(JSON.stringify(payload, null, 2));

    if (!payload.info) {
      this.logger.warn('No info found for SERVICE_REQUEST_DECLINED');
      return;
    }

    try {
      const buyerId = payload.info.buyerId;
      const notificationData: SocketNotification = {
        type: EVENT_TYPES.SERVICE_REQUEST_DECLINED,
        title: 'Service Request Declined',
        message: `${payload.info.sellerName} has declined your service request for "${payload.info.serviceName}"`,
        createdAt: new Date(),
        meta: {
          serviceRequestId: payload.info.serviceRequestId,
          serviceId: payload.info.serviceId,
          serviceName: payload.info.serviceName,
          sellerId: payload.info.sellerId,
          sellerName: payload.info.sellerName,
          status: 'DECLINED',
          reason: payload.info.reason || undefined,
          ...payload.meta,
        },
      };

      // SAVE TO DATABASE (Single save)
      await this.saveNotificationToDatabase(
        buyerId,
        notificationData.title,
        notificationData.message,
        notificationData.meta,
        'service',
      );

      // SEND EMAIL NOTIFICATION
      try {
        const buyer = await this.prisma.client.user.findUnique({
          where: { id: buyerId },
          select: { email: true, name: true },
        });

        if (buyer?.email) {
          const reasonText = payload.info.reason
            ? `<p><strong>Reason:</strong> ${payload.info.reason}</p>`
            : '';
          await this.mailService.sendMail({
            to: buyer.email,
            subject: 'Service Request Declined',
            html: `
                        <p>Hello ${buyer.name || 'Buyer'},</p>
                        <p><strong>${payload.info.sellerName}</strong> has declined your service request for <strong>"${payload.info.serviceName}"</strong>.</p>
                        ${reasonText}
                        <p>You can create a new request or contact the seller for more details.</p>
                        <p>Thank you,<br/>DaConnect Team</p>
                        `,
            text: `Service Request Declined: ${payload.info.sellerName} has declined your service request for "${payload.info.serviceName}".`,
          });
          this.logger.log(`Email notification sent to buyer ${buyerId}`);
        }
      } catch (emailError: any) {
        this.logger.error(
          `Failed to send email notification: ${emailError.message}`,
        );
      }

      // SEND VIA SOCKET AND FIREBASE
      await this.sendNotificationToUser(buyerId, notificationData, {
        title: notificationData.title,
        body: notificationData.message,
        type: NotificationType.SERVICE_REQUEST_DECLINED,
        data: {
          serviceRequestId: payload.info.serviceRequestId,
          sellerId: payload.info.sellerId,
          sellerName: payload.info.sellerName,
          serviceName: payload.info.serviceName,
          status: 'DECLINED',
          reason: payload.info.reason || 'No reason provided',
        },
      });

      this.logger.log('SERVICE_REQUEST_DECLINED event processing complete');
    } catch (error: any) {
      this.logger.error(
        `Error processing SERVICE_REQUEST_DECLINED event: ${error.message}`,
      );
    }
  }
}

import { forwardRef, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SendPrivateMessageDto } from '../dto/privateChatGateway.dto';

import { PrivateChatEvents } from '@/common/enum/privateChat.enum';
import * as jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { ENVEnum } from 'src/common/enum/env.enum';
import { PrismaService } from 'src/lib/prisma/prisma.service';

import {
  RTCAnswerDto,
  RTCIceCandidateDto,
  RTCOfferDto,
} from '../../call/dto/wertc.dto';
import { CallService } from '../../call/service/call.service';
import { PrivateChatService } from '../service/private-message.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/message',
})
export class PrivateChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PrivateChatGateway.name);

  // Track userId -> socketId mapping
  private userSocketMap = new Map<string, string>();

  constructor(
    private readonly privateChatService: PrivateChatService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CallService))
    private readonly callService: CallService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log(
      'Socket.IO server initialized FOR PRIVATE CHAT',
      server.adapter.name,
    );
  }

  async handleConnection(client: Socket) {
    const authHeader =
      client.handshake.headers.authorization || client.handshake.auth?.token;

    if (!authHeader) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Missing authorization header',
      });
      client.disconnect(true);
      this.logger.warn('Missing auth header');
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      client.emit(PrivateChatEvents.ERROR, { message: 'Missing token' });
      client.disconnect(true);
      this.logger.warn('Missing token');
      return;
    }

    try {
      const jwtSecret = this.configService.get<string>(ENVEnum.JWT_SECRET);
      const payload: any = jwt.verify(token, jwtSecret as string);
      const userId = payload.sub;

      if (!userId) {
        client.emit(PrivateChatEvents.ERROR, {
          message: 'Invalid token payload',
        });
        client.disconnect(true);
        this.logger.warn('Missing user ID in token payload');
        return;
      }

      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        client.emit(PrivateChatEvents.ERROR, {
          message: 'User not found in database',
        });
        client.disconnect(true);
        this.logger.warn(`User not found: ${userId}`);
        return;
      }

      client.data.userId = userId;
      client.join(userId);

      // Store socket mapping
      this.userSocketMap.set(userId, client.id);

      await this.privateChatService.markUserActive(userId);

      this.server.emit(PrivateChatEvents.USER_STATUS_CHANGED, {
        userId,
        isOnline: true,
        status: 'online',
      });

      client.emit(PrivateChatEvents.SUCCESS, { userId });
      this.logger.log(
        `Private chat: User ${userId} connected, socket ${client.id}`,
      );
    } catch (err) {
      client.emit(PrivateChatEvents.ERROR, {
        message: err.message || 'Authentication failed',
      });
      client.disconnect(true);
      this.logger.warn(`Authentication failed: ${err.message}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      client.leave(userId);

      // Remove from socket mapping
      this.userSocketMap.delete(userId);

      // Handle call disconnection
      this.callService.handleSocketDisconnect(client.id, userId);

      await this.privateChatService.markUserInactive(userId);

      this.server.emit(PrivateChatEvents.USER_STATUS_CHANGED, {
        userId,
        isOnline: false,
        status: 'offline',
      });

      this.logger.log(
        `Private chat disconnected: ${client.id}, user: ${userId}`,
      );
    } else {
      this.logger.log(`Private chat disconnected: ${client.id}`);
    }
  }

  /** -------------------- Chat Events -------------------- */

  @SubscribeMessage(PrivateChatEvents.LOAD_CONVERSATIONS)
  async handleLoadConversations(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      const conversations =
        await this.privateChatService.getUserConversations(userId);
      client.emit(PrivateChatEvents.CONVERSATION_LIST, conversations);
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to load conversations',
        error: error.message,
      });
      this.logger.error(
        `Failed to load conversations for user ${userId}:`,
        error.message,
      );
    }
  }

  @SubscribeMessage(PrivateChatEvents.LOAD_SINGLE_CONVERSATION)
  async handleLoadSingleConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      const conversation =
        await this.privateChatService.getPrivateConversationWithMessages(
          conversationId,
          userId,
        );
      client.emit(PrivateChatEvents.NEW_CONVERSATION, conversation);
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to load conversation',
        error: error.message,
      });
      this.logger.error(
        `Failed to load conversation ${conversationId} for user ${userId}:`,
        error.message,
      );
    }
  }

  @SubscribeMessage(PrivateChatEvents.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() payload: SendPrivateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const { recipientId } = payload;

    if (userId === recipientId) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Cannot send message to yourself',
      });
      this.logger.log(`User ${userId} attempted to message themselves`);
      return;
    }

    try {
      let conversation = await this.privateChatService.findConversation(
        userId,
        recipientId,
      );

      let isNewConversation = false;
      if (!conversation) {
        conversation = await this.privateChatService.createConversation(
          userId,
          recipientId,
        );
        isNewConversation = true;
      }

      const message = await this.privateChatService.sendPrivateMessage(
        conversation.id,
        userId,
        payload,
      );

      this.server.to(userId).emit(PrivateChatEvents.NEW_MESSAGE, message);
      this.server.to(recipientId).emit(PrivateChatEvents.NEW_MESSAGE, message);

      if (isNewConversation) {
        const [senderConversations, recipientConversations] = await Promise.all(
          [
            this.privateChatService.getUserConversations(userId),
            this.privateChatService.getUserConversations(recipientId),
          ],
        );

        this.server
          .to(userId)
          .emit(PrivateChatEvents.CONVERSATION_LIST, senderConversations);
        this.server
          .to(recipientId)
          .emit(PrivateChatEvents.CONVERSATION_LIST, recipientConversations);
      }

      this.logger.log(
        `Message sent from ${userId} to ${recipientId} in conversation ${conversation.id}`,
      );
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to send message',
        error: error.message,
      });
      this.logger.error(
        `Failed to send message from ${userId} to ${recipientId}:`,
        error.message,
      );
    }
  }

  @SubscribeMessage(PrivateChatEvents.MARK_AS_READ)
  async handleMarkAsRead(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      await this.privateChatService.markMessagesAsRead(conversationId, userId);

      const conversation =
        await this.prisma.client.privateConversation.findUnique({
          where: { id: conversationId },
        });

      if (conversation) {
        const otherUserId =
          conversation.initiatorId === userId
            ? conversation.receiverId
            : conversation.initiatorId;

        if (otherUserId) {
          this.server.to(otherUserId).emit(PrivateChatEvents.MESSAGE_READ, {
            conversationId,
            readByUserId: userId,
          });
        }
      }

      client.emit(PrivateChatEvents.SUCCESS, {
        message: 'Messages marked as read',
      });
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to mark messages as read',
        error: error.message,
      });
      this.logger.error(
        `Failed to mark messages as read for conversation ${conversationId}:`,
        error.message,
      );
    }
  }

  @SubscribeMessage(PrivateChatEvents.DELETE_MESSAGE)
  async handleDeleteMessage(
    @MessageBody() messageId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      const deletedMessage = await this.privateChatService.deleteMessage(
        messageId,
        userId,
      );

      const conversation =
        await this.prisma.client.privateConversation.findUnique({
          where: { id: deletedMessage.conversationId },
        });

      if (conversation) {
        [conversation.initiatorId, conversation.receiverId].forEach(
          (participantId: string) => {
            this.server
              .to(participantId)
              .emit(PrivateChatEvents.MESSAGE_DELETED, {
                messageId,
                conversationId: deletedMessage.conversationId,
              });
          },
        );
      }

      this.logger.log(`Message ${messageId} deleted by user ${userId}`);
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to delete message',
        error: error.message,
      });
      this.logger.error(
        `Failed to delete message ${messageId}:`,
        error.message,
      );
    }
  }

  @SubscribeMessage(PrivateChatEvents.TYPING_START)
  async handleTypingStart(
    @MessageBody() data: { conversationId: string; recipientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    this.server.to(data.recipientId).emit(PrivateChatEvents.TYPING_START, {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage(PrivateChatEvents.TYPING_STOP)
  async handleTypingStop(
    @MessageBody() data: { conversationId: string; recipientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    this.server.to(data.recipientId).emit(PrivateChatEvents.TYPING_STOP, {
      conversationId: data.conversationId,
      userId,
    });
  }

  /** -------------------- Call Events -------------------- */

  @SubscribeMessage('call:accept')
  async handleAcceptCall(
    @MessageBody() data: { callId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      await this.callService.acceptCall(data.callId, userId, client.id);
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to accept call',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('call:reject')
  async handleRejectCall(
    @MessageBody() data: { callId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      await this.callService.rejectCall(data.callId, userId);
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to reject call',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('call:end')
  async handleEndCall(
    @MessageBody() data: { callId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      await this.callService.endCall(data.callId, userId);
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to end call',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('call:offer')
  async handleCallOffer(
    @MessageBody() data: RTCOfferDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      await this.callService.sendOffer(data.callId, userId, data.sdp);
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to send offer',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('call:answer')
  async handleCallAnswer(
    @MessageBody() data: RTCAnswerDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      await this.callService.sendAnswer(data.callId, userId, data.sdp);
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to send answer',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('call:ice-candidate')
  async handleIceCandidate(
    @MessageBody() data: RTCIceCandidateDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      await this.callService.sendIceCandidate(data.callId, userId, {
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex,
      });
    } catch (error) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Failed to send ICE candidate',
        error: error.message,
      });
    }
  }

  /** -------------------- Helpers -------------------- */

  emitNewMessage(userId: string, message: any) {
    this.server.to(userId).emit(PrivateChatEvents.NEW_MESSAGE, message);
  }

  getUserSocket(userId: string): Socket | null {
    const socketId = this.userSocketMap.get(userId);
    if (!socketId) return null;

    return this.server.sockets.sockets.get(socketId) || null;
  }

  private getUserIdFromSocket(client: Socket): string | null {
    const userId = client.data?.userId;
    if (!userId) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'User not authenticated',
      });
      this.logger.warn(`User ID not found in socket client: ${client.id}`);
      return null;
    }
    return userId;
  }
}

import { Logger } from '@nestjs/common';
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
import { PrivateChatService } from '../service/private-message.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/message',
})
export class PrivateChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PrivateChatGateway.name);

  constructor(
    private readonly privateChatService: PrivateChatService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log(
      'Socket.IO server initialized FOR PRIVATE CHAT',
      server.adapter.name,
    );
  }

  /** Handle socket connection and authentication */
  /** Handle socket connection and authentication */
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

    // Handle both "Bearer token" and direct token format
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

      // Mark user as active
      await this.privateChatService.markUserActive(userId);

      // Notify all users that this user is now online
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

      // Mark user as inactive
      await this.privateChatService.markUserInactive(userId);

      // Notify all users that this user is now offline
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

  /** Load all conversations for the connected user */
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

  /** Load a single conversation */
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

  /** Send a message (create conversation if new) */
  @SubscribeMessage(PrivateChatEvents.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() payload: SendPrivateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const { recipientId } = payload;

    // Prevent sending message to yourself
    if (userId === recipientId) {
      client.emit(PrivateChatEvents.ERROR, {
        message: 'Cannot send message to yourself',
      });
      this.logger.log(`User ${userId} attempted to message themselves`);
      return;
    }

    try {
      // Find existing conversation
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

      // Send message
      const message = await this.privateChatService.sendPrivateMessage(
        conversation.id,
        userId,
        payload,
      );

      // Emit new message to both users
      this.server.to(userId).emit(PrivateChatEvents.NEW_MESSAGE, message);
      this.server.to(recipientId).emit(PrivateChatEvents.NEW_MESSAGE, message);

      // If new conversation, send updated conversation lists
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

  /** Mark messages as read */
  @SubscribeMessage(PrivateChatEvents.MARK_AS_READ)
  async handleMarkAsRead(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      await this.privateChatService.markMessagesAsRead(conversationId, userId);

      // Notify the other user that messages have been read
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

  /** Delete a message */
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

      // Notify both users about the deletion
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

  /** Typing indicator - start */
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

  /** Typing indicator - stop */
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

  /** Helper for external services to emit new messages */
  emitNewMessage(userId: string, message: any) {
    this.server.to(userId).emit(PrivateChatEvents.NEW_MESSAGE, message);
  }

  /** Helper to get userId from socket with validation */
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

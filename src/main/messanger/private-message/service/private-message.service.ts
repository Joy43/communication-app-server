import { Injectable, NotFoundException } from '@nestjs/common';
// import { AppError } from 'src/common/error/handle-error.app';
// import { HandleError } from 'src/common/error/handle-error.decorator';
// import { successResponse } from 'src/common/utilsResponse/response.util';
import { successResponse } from '@/common/utils/response.util';
import { AppError } from '@/core/error/handle-error.app';
import { HandleError } from '@/core/error/handle-error.decorator';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { SendPrivateMessageDto } from '../dto/privateChatGateway.dto';

@Injectable()
export class PrivateChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a private message and update lastMessage in conversation
   */
  @HandleError('Failed to send private message', 'PRIVATE_CHAT')
  async sendPrivateMessage(
    conversationId: string,
    senderId: string,
    dto: SendPrivateMessageDto,
  ) {
    const message = await this.prisma.client.privateMessage.create({
      data: {
        content: dto.content,
        type: dto.messageType || 'TEXT',
        conversationId,
        senderId,
        ...(dto.fileId && { fileId: dto.fileId }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        file: true,
      },
    });

    // Update last message reference in conversation
    await this.prisma.client.privateConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    // Fetch conversation to set delivery status
    const conversation =
      await this.prisma.client.privateConversation.findUnique({
        where: { id: conversationId },
      });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    await this.prisma.client.privateMessageStatus.createMany({
      data: [
        {
          messageId: message.id,
          userId: conversation.initiatorId,
          status: 'SENT',
        },
        {
          messageId: message.id,
          userId: conversation.receiverId,
          status: 'SENT',
        },
      ],
      skipDuplicates: true,
    });

    return message;
  }

  /**
   *-------------------- Load all chats ----------------------
   */
  @HandleError('Failed to get all chats with last message')
  async getAllChatsWithLastMessage(userId: string) {
    // ---------- Private chats -----------------
    const privateChats = await this.prisma.client.privateConversation.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: {
        lastMessage: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
            file: true,
          },
        },
        initiator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedPrivateChats = privateChats.map((chat: any) => {
      const otherUser =
        chat.initiatorId === userId ? chat.receiver : chat.initiator;
      return {
        type: 'private',
        chatId: chat.id,
        participant: otherUser,
        lastMessage: chat.lastMessage
          ? {
              id: chat.lastMessage.id,
              content: chat.lastMessage.content,
              createdAt: chat.lastMessage.createdAt,
              sender: chat.lastMessage.sender,
              file: chat.lastMessage.file,
            }
          : null,
        updatedAt: chat.updatedAt,
      };
    });

    // ------------ Merge & sort-------------------
    const allChats = [...formattedPrivateChats].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    return successResponse(allChats, 'Chats fetched successfully');
  }

  /**
   * Find existing conversation between two users or create one
   */
  @HandleError('Failed to find conversation', 'PRIVATE_CHAT')
  async findConversation(userA: string, userB: string) {
    return this.prisma.client.privateConversation.findFirst({
      where: {
        OR: [
          { AND: [{ initiatorId: userA }, { receiverId: userB }] },
          { AND: [{ initiatorId: userB }, { receiverId: userA }] },
        ],
      },
    });
  }

  /**
   * Create new conversation between two users
   */
  @HandleError('Failed to create conversation', 'PRIVATE_CHAT')
  async createConversation(userA: string, userB: string) {
    return this.prisma.client.privateConversation.create({
      data: {
        initiatorId: userA,
        receiverId: userB,
      },
    });
  }

  /**
   * Find existing conversation between two users or create one
   */
  @HandleError('Failed to find or create conversation', 'PRIVATE_CHAT')
  async findOrCreateConversation(userA: string, userB: string) {
    let conversation = await this.findConversation(userA, userB);
    if (!conversation) {
      conversation = await this.createConversation(userA, userB);
    }
    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  @HandleError("Error getting user's conversations", 'PRIVATE_CHAT')
  async getUserConversations(userId: string) {
    const conversations = await this.prisma.client.privateConversation.findMany(
      {
        where: {
          OR: [{ initiatorId: userId }, { receiverId: userId }],
        },
        include: {
          lastMessage: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  profilePicture: true,
                },
              },
              file: true,
              statuses: {
                where: { userId },
                select: { status: true },
              },
            },
          },
          initiator: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      },
    );

    return conversations.map((chat: any) => {
      const otherUser =
        chat.initiatorId === userId ? chat.receiver : chat.initiator;
      const userStatus = chat.lastMessage?.statuses?.[0]?.status;
      return {
        type: 'private',
        chatId: chat.id,
        participant: otherUser,
        lastMessage: chat.lastMessage || null,
        updatedAt: chat.updatedAt,
        isRead: userStatus === 'READ',
      };
    });
  }

  /**
   * Get all messages for a conversation
   */
  @HandleError("Conversation doesn't exist", 'PRIVATE_CHAT')
  async getConversationMessages(conversationId: string) {
    return this.prisma.client.privateMessage.findMany({
      where: { conversationId },
      include: {
        sender: true,
        // file: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get a conversation with messages (validate access)
   */
  @HandleError("Conversation doesn't exist", 'PRIVATE_CHAT')
  async getPrivateConversationWithMessages(
    conversationId: string,
    userId: string,
  ) {
    const conversation = await this.prisma.client.privateConversation.findFirst(
      {
        where: {
          id: conversationId,
          OR: [{ initiatorId: userId }, { receiverId: userId }],
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  profilePicture: true,
                },
              },
              file: true,
              statuses: {
                select: {
                  userId: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    );

    if (!conversation) {
      throw new AppError(404, `Conversation not found or access denied`);
    }

    return {
      conversationId: conversation.id,
      participants: [conversation.initiator, conversation.receiver],
      messages: conversation.messages,
    };
  }

  /**
   * Mark messages as read for a user in a conversation
   */
  @HandleError('Failed to mark messages as read', 'PRIVATE_CHAT')
  async markMessagesAsRead(conversationId: string, userId: string) {
    // Get all unread messages in the conversation not sent by the user
    const messages = await this.prisma.client.privateMessage.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
      },
      select: { id: true },
    });

    // Update statuses to READ
    const messageIds = messages.map((m) => m.id);
    if (messageIds.length > 0) {
      await this.prisma.client.privateMessageStatus.updateMany({
        where: {
          messageId: { in: messageIds },
          userId,
          status: { not: 'READ' },
        },
        data: { status: 'READ' },
      });
    }
  }

  /**
   * Delete a message
   */
  @HandleError('Failed to delete message', 'PRIVATE_CHAT')
  async deleteMessage(messageId: string, userId: string) {
    // Verify the user is the sender
    const message = await this.prisma.client.privateMessage.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!message) {
      throw new AppError(
        404,
        'Message not found or you are not authorized to delete it',
      );
    }

    // Delete the message
    await this.prisma.client.privateMessage.delete({
      where: { id: messageId },
    });

    return message;
  }

  /**
   * Delete a conversation
   */
  @HandleError('Failed to delete conversation', 'PRIVATE_CHAT')
  async deleteConversation(conversationId: string) {
    return this.prisma.client.privateConversation.deleteMany({
      where: { id: conversationId },
    });
  }

  /**
   * Get all users with active users first
   * Active users are determined by recent socket connections or last activity
   */
  @HandleError('Failed to get all users', 'PRIVATE_CHAT')
  async getAllUsers(currentUserId?: string) {
    // Get all users except current user
    const users = await this.prisma.client.user.findMany({
      where: currentUserId ? { id: { not: currentUserId } } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        isOnline: true, // Assuming you have this field
        lastActiveAt: true, // Correct field name
      },
      orderBy: [
        { isOnline: 'desc' }, // Online users first
        { lastActiveAt: 'desc' }, // Then by last seen
        { name: 'asc' }, // Then alphabetically
      ],
    });

    // Format response with online status
    return users.map((user) => ({
      ...user,
      status: this.getUserStatus(user.isOnline, user.lastActiveAt),
    }));
  }

  /**
   * Determine user status based on online flag and last seen
   */
  private getUserStatus(isOnline: boolean, lastActiveAt: Date | null): string {
    if (isOnline) return 'online';

    if (!lastActiveAt) return 'offline';

    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - new Date(lastActiveAt).getTime()) / 1000 / 60,
    );

    if (diffMinutes < 5) return 'recently_active';
    if (diffMinutes < 60) return 'active_today';
    return 'offline';
  }

  /**
   * Mark user as active (online)
   */
  @HandleError('Failed to mark user active', 'PRIVATE_CHAT')
  async markUserActive(userId: string) {
    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        isOnline: true,
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Mark user as inactive (offline)
   */
  @HandleError('Failed to mark user inactive', 'PRIVATE_CHAT')
  async markUserInactive(userId: string) {
    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Search users by name or email
   */
  @HandleError('Failed to search users', 'PRIVATE_CHAT')
  async searchUsers(query: string, currentUserId?: string) {
    const users = await this.prisma.client.user.findMany({
      where: {
        AND: [
          currentUserId ? { id: { not: currentUserId } } : {},
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        isOnline: true,
        lastActiveAt: true,
      },
      orderBy: [
        { isOnline: 'desc' },
        { lastActiveAt: 'desc' },
        { name: 'asc' },
      ],
      take: 20,
    });

    return users.map((user) => ({
      ...user,
      status: this.getUserStatus(user.isOnline, user.lastActiveAt),
    }));
  }

  /**
   * Get online status for multiple users
   */
  @HandleError('Failed to get users online status', 'PRIVATE_CHAT')
  async getUsersOnlineStatus(userIds: string[]) {
    const users = await this.prisma.client.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        isOnline: true,
        lastActiveAt: true,
      },
    });

    return users.map((user) => ({
      userId: user.id,
      isOnline: user.isOnline,
      status: this.getUserStatus(user.isOnline, user.lastActiveAt),
      lastActiveAt: user.lastActiveAt,
    }));
  }
}

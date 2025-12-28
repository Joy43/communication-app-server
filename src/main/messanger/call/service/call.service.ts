import { PrismaService } from '@/lib/prisma/prisma.service';
import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CallStatus, CallType } from '@prisma';
import { PrivateChatGateway } from '../../private-message/message-gateway/message-gateway';

@Injectable()
export class CallService {
  private readonly logger = new Logger(CallService.name);

  // callId -> ( userId -> socketId )
  private callSocketMap = new Map<string, Map<string, string>>();
  private ringTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PrivateChatGateway))
    private readonly chatGateway: PrivateChatGateway,
  ) {
    this.logger.log('CallService initialized');
  }

  /** -------------------- HTTP Methods -------------------- */

  async initiateCallFromHttp(
    conversationId: string,
    callerId: string,
    callType: CallType,
  ) {
    // Get conversation details
    const conversation = await this.prisma.client.privateConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const recipientId = conversation.initiatorId === callerId
      ? conversation.receiverId
      : conversation.initiatorId;

    // Create call record
    const call = await this.prisma.client.privateCall.create({
      data: {
        conversationId,
        initiatorId: callerId,
        type: callType,
        status: CallStatus.INITIATED,
      },
    });

    // Add participants
    await this.prisma.client.privateCallParticipant.createMany({
      data: [
        { callId: call.id, userId: callerId, status: 'JOINED' },
        { callId: call.id, userId: recipientId, status: 'JOINED' },
      ],
    });

    // Get caller socket
    const callerSocket = this.chatGateway.getUserSocket(callerId);
    if (callerSocket) {
      const map = this.ensureCallSocketEntry(call.id);
      map.set(callerId, callerSocket.id);
    }

    // Set ring timeout
    this.setRingTimeout(call.id);

    // Emit to recipient
    this.chatGateway.server.to(recipientId).emit('call:incoming', {
      callId: call.id,
      callerId,
      recipientId,
      type: callType,
      conversationId,
    });

    return {
      success: true,
      callId: call.id,
      message: 'Call initiated',
    };
  }

  async acceptCallFromHttp(callId: string, userId: string) {
    const userSocket = this.chatGateway.getUserSocket(userId);
    if (!userSocket) {
      throw new Error('User not connected to socket');
    }

    return await this.acceptCall(callId, userId, userSocket.id);
  }

  async rejectCallFromHttp(callId: string, userId: string) {
    return await this.rejectCall(callId, userId);
  }

  async endCallFromHttp(callId: string, userId: string) {
    return await this.endCall(callId, userId);
  }

  /** -------------------- WebSocket Methods -------------------- */

  async acceptCall(callId: string, userId: string, socketId: string) {
    this.logger.log(`User ${userId} accepting call ${callId}`);

    this.clearRingTimeout(callId);

    const map = this.ensureCallSocketEntry(callId);
    map.set(userId, socketId);

    await this.prisma.client.privateCall.update({
      where: { id: callId },
      data: { status: CallStatus.ONGOING },
    });

    // Update participant status
    await this.prisma.client.privateCallParticipant.updateMany({
      where: { callId, userId },
      data: { status: 'JOINED' },
    });

    // Notify all participants
    this.chatGateway.server.emit('call:accepted', {
      callId,
      userId,
    });

    return { success: true };
  }

  async rejectCall(callId: string, userId: string) {
    this.logger.log(`User ${userId} rejecting call ${callId}`);

    this.clearRingTimeout(callId);

    await this.prisma.client.privateCall.update({
      where: { id: callId },
      data: { status: CallStatus.ENDED, endedAt: new Date() },
    });

    // Update participant status
    await this.prisma.client.privateCallParticipant.updateMany({
      where: { callId, userId },
      data: { status: 'MISSED', leftAt: new Date() },
    });

    this.chatGateway.server.emit('call:rejected', {
      callId,
      userId,
    });

    this.callSocketMap.delete(callId);

    return { success: true };
  }

  async endCall(callId: string, userId: string) {
    this.logger.log(`User ${userId} ending call ${callId}`);

    this.clearRingTimeout(callId);

    const call = await this.prisma.client.privateCall.findUnique({
      where: { id: callId },
    });

    if (call && call.status === CallStatus.ONGOING) {
      await this.prisma.client.privateCall.update({
        where: { id: callId },
        data: { status: CallStatus.ENDED, endedAt: new Date() },
      });
    }

    // Update all participants
    await this.prisma.client.privateCallParticipant.updateMany({
      where: { callId },
      data: { status: 'LEFT', leftAt: new Date() },
    });

    this.chatGateway.server.emit('call:ended', {
      callId,
      userId,
    });

    this.callSocketMap.delete(callId);

    return { success: true };
  }

  // WebRTC signaling methods
  async sendOffer(callId: string, userId: string, offer: any) {
    this.logger.log(`User ${userId} sending offer for call ${callId}`);

    const participants = await this.getCallParticipantsFromDb(callId);
    const recipient = participants.find(p => p !== userId);

    if (recipient) {
      this.chatGateway.server.to(recipient).emit('call:offer', {
        callId,
        userId,
        offer,
      });
    }

    return { success: true };
  }

  async sendAnswer(callId: string, userId: string, answer: any) {
    this.logger.log(`User ${userId} sending answer for call ${callId}`);

    const participants = await this.getCallParticipantsFromDb(callId);
    const recipient = participants.find(p => p !== userId);

    if (recipient) {
      this.chatGateway.server.to(recipient).emit('call:answer', {
        callId,
        userId,
        answer,
      });
    }

    return { success: true };
  }

  async sendIceCandidate(callId: string, userId: string, candidate: any) {
    this.logger.debug(`User ${userId} sending ICE candidate for call ${callId}`);

    const participants = await this.getCallParticipantsFromDb(callId);
    const recipient = participants.find(p => p !== userId);

    if (recipient) {
      this.chatGateway.server.to(recipient).emit('call:ice-candidate', {
        callId,
        userId,
        candidate,
      });
    }

    return { success: true };
  }

  handleSocketDisconnect(socketId: string, userId: string) {
    this.logger.debug(`Handling disconnect for socket ${socketId}, user ${userId}`);

    for (const [callId, userMap] of this.callSocketMap.entries()) {
      if (userMap.get(userId) === socketId) {
        this.chatGateway.server.emit('call:participant-disconnected', {
          callId,
          userId,
        });

        userMap.delete(userId);
        if (userMap.size === 0) {
          this.callSocketMap.delete(callId);
          this.clearRingTimeout(callId);
        }
      }
    }
  }

  /** -------------------- Helpers -------------------- */

  private async getCallParticipantsFromDb(callId: string): Promise<string[]> {
    const participants = await this.prisma.client.privateCallParticipant.findMany({
      where: { callId },
      select: { userId: true },
    });
    return participants.map(p => p.userId);
  }

  private ensureCallSocketEntry(callId: string) {
    if (!this.callSocketMap.has(callId)) {
      this.logger.debug(`Creating new socket map entry for call ${callId}`);
      this.callSocketMap.set(callId, new Map());
    }
    return this.callSocketMap.get(callId)!;
  }

  private setRingTimeout(callId: string, ms = 45_000) {
    this.logger.debug(`Setting ring timeout for call ${callId}: ${ms}ms`);
    this.clearRingTimeout(callId);

    const t = setTimeout(async () => {
      try {
        this.logger.log(`Call ${callId} ring timeout -> marking missed`);
        await this.prisma.client.privateCall.update({
          where: { id: callId },
          data: { status: CallStatus.MISSED, endedAt: new Date() },
        });

        await this.prisma.client.privateCallParticipant.updateMany({
          where: { callId },
          data: { status: 'MISSED', leftAt: new Date() },
        });

        this.chatGateway.server.emit('call:missed', { callId });

        this.callSocketMap.delete(callId);
        this.logger.log(`Call ${callId} marked as missed due to timeout`);
      } catch (err) {
        this.logger.error(`Failed to mark call ${callId} as missed`, err as any);
      } finally {
        this.clearRingTimeout(callId);
      }
    }, ms);

    this.ringTimeouts.set(callId, t);
  }

  private clearRingTimeout(callId: string) {
    const t = this.ringTimeouts.get(callId);
    if (t) {
      this.logger.debug(`Clearing ring timeout for call ${callId}`);
      clearTimeout(t);
      this.ringTimeouts.delete(callId);
    }
  }

  getCallSocketId(callId: string, userId: string): string | null {
    const map = this.callSocketMap.get(callId);
    return map?.get(userId) ?? null;
  }

  getCallParticipants(callId: string): string[] {
    const map = this.callSocketMap.get(callId);
    return map ? Array.from(map.keys()) : [];
  }
}
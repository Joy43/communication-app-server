import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
@Injectable()
export class CallService {
  private readonly logger = new Logger(CallService.name);
  private callSocketMap = new Map<string, Map<string, string>>();
  private ringTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,

  ) {}

  /** -------------------- Public Methods -------------------- */
  async initiateCall(
    callId: string,
    callerId: string,
    recipientId: string,
    callerSocketId: string,
  ) {
    this.logger.log(
      `Initiating call ${callId} from ${callerId} to ${recipientId}`,
    );

    // Validate that both users exist
    const [caller, recipient] = await Promise.all([
      this.prisma.client.user.findUnique({ where: { id: callerId } }),
      this.prisma.client.user.findUnique({ where: { id: recipientId } }),
    ]);

    if (!caller) {
      throw new Error(`Caller user not found: ${callerId}`);
    }

    if (!recipient) {
      throw new Error(`Recipient user not found: ${recipientId}`);
    }

    const map = this.ensureCallSocketEntry(callId);
    map.set(callerId, callerSocketId);

    this.setRingTimeout(callId);

   

    return { success: true };
  }

  async acceptCall(callId: string, userId: string, socketId: string) {
    this.logger.log(`User ${userId} accepting call ${callId}`);

    this.clearRingTimeout(callId);

    const map = this.ensureCallSocketEntry(callId);
    map.set(userId, socketId);

    await this.prisma.client.calling.update({
      where: { id: callId },
      data: { status: 'ACTIVE' },
    });

  return { success: true };
  }

  async rejectCall(callId: string, userId: string) {
    this.logger.log(`User ${userId} rejecting call ${callId}`);

    this.clearRingTimeout(callId);

    await this.prisma.client.calling.update({
      where: { id: callId },
      data: {
        status: 'DECLINED',
        endedAt: new Date(),
      },
    });

  

    this.callSocketMap.delete(callId);

    return { success: true };
  }

  async endCall(callId: string, userId: string) {
    this.logger.log(`User ${userId} ending call ${callId}`);

    this.clearRingTimeout(callId);

    const call = await this.prisma.client.calling.findUnique({
      where: { id: callId },
    });

    if (call && call.status === 'ACTIVE') {
      await this.prisma.client.calling.update({
        where: { id: callId },
        data: {
          status: 'END',
          endedAt: new Date(),
        },
      });
    }

  

    this.callSocketMap.delete(callId);

    return { success: true };
  }

  /** -------------------- Private Methods -------------------- */

  private ensureCallSocketEntry(callId: string) {
    if (!this.callSocketMap.has(callId)) {
      this.callSocketMap.set(callId, new Map());
    }
    return this.callSocketMap.get(callId)!;
  }

  private clearRingTimeout(callId: string) {
    const timeout = this.ringTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.ringTimeouts.delete(callId);
    }
  }

  private setRingTimeout(callId: string, ms = 30_000) {
    this.logger.debug(`Setting ring timeout for call ${callId}: ${ms}ms`);
    this.clearRingTimeout(callId);

    const t = setTimeout(async () => {
      try {
        this.logger.log(`Call ${callId} ring timeout -> marking missed`);
        await this.prisma.client.calling.update({
          where: { id: callId },
          data: {
            status: 'MISSED',
            endedAt: new Date(),
          },
        });

     

        this.callSocketMap.delete(callId);
        this.logger.log(`Call ${callId} marked as missed due to timeout`);
      } catch (err) {
        this.logger.error(
          `Failed to mark call ${callId} as missed`,
          err as any,
        );
      } finally {
        this.clearRingTimeout(callId);
      }
    }, ms);

    this.ringTimeouts.set(callId, t);
  }
}

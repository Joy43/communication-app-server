// import { PrismaService } from "@lib/prisma/prisma.service";
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CallStatus } from '@prisma';
// import { CallStatus } from "@prisma/client";
@Injectable()
export class CallService {
  constructor(private prisma: PrismaService) {}

  async createCall(
    hostUserId: string,
    recipientUserId: string,
    title?: string,
  ) {
    console.log('Creating call:', { hostUserId, recipientUserId, title });

    // Validate that both users exist before creating the call
    const [hostUser, recipientUser] = await Promise.all([
      this.prisma.client.user.findUnique({
        where: { id: hostUserId },
      }),
      this.prisma.client.user.findUnique({
        where: { id: recipientUserId },
      }),
    ]);

    console.log('User validation:', {
      hostUserExists: !!hostUser,
      recipientUserExists: !!recipientUser,
    });

    if (!hostUser) {
      throw new Error(`Host user not found with ID: ${hostUserId}`);
    }

    if (!recipientUser) {
      throw new Error(`Recipient user not found with ID: ${recipientUserId}`);
    }

    return this.prisma.client.calling.create({
      data: {
        hostUserId,
        recipientUserId,
        title,
      },
    });
  }

  async markRinging(callId: string) {
    return this.prisma.client.calling.update({
      where: { id: callId },
      data: { status: CallStatus.RINING },
    });
  }

  async markActive(callId: string) {
    return this.prisma.client.calling.update({
      where: { id: callId },
      data: { status: CallStatus.ACTIVE, startedAt: new Date() },
    });
  }

  async markDeclined(callId: string) {
    return this.prisma.client.calling.update({
      where: { id: callId },
      data: { status: CallStatus.DECLINED, endedAt: new Date() },
    });
  }

  async markMissed(callId: string) {
    return this.prisma.client.calling.update({
      where: { id: callId },
      data: { status: CallStatus.MISSED, endedAt: new Date() },
    });
  }

  async endCall(callId: string) {
    return this.prisma.client.calling.update({
      where: { id: callId },
      data: { status: CallStatus.END, endedAt: new Date() },
    });
  }

  async getCallStatus(callId: string) {
    const call = await this.prisma.client.calling.findUnique({
      where: { id: callId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        endedAt: true,
        hostUserId: true,
        recipientUserId: true,
        title: true,
      },
    });

    if (!call) {
      throw new Error('Call not found');
    }

    return call;
  }
}

import { PrismaService } from '@/lib/prisma/prisma.service';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';

import { CallService } from './call.service';
import { PrivateChatGateway } from '../../private-message/message-gateway/message-gateway';

@Injectable()
export class WebRTCService {
  private readonly logger = new Logger(WebRTCService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PrivateChatGateway))
    private readonly chatGateway: PrivateChatGateway,
    private readonly callService: CallService,
  ) {
    this.logger.log('WebRTCService initialized');
  }
}
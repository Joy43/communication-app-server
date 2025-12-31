import { PrismaService } from '@/lib/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { CallController } from './call.controller';
import { CallGateway } from './call.gateway';
import { CallService } from './call.service';

@Module({
  controllers: [CallController],
  providers: [CallGateway, CallService, PrismaService],
})
export class CallModule {}

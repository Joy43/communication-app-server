import { PrismaService } from '@/lib/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { CallGateway } from './call.gateway';
import { CallService } from './call.service';
import { CallController } from './controller/call.controller';

@Module({
  controllers: [CallController],
  providers: [CallGateway, CallService, PrismaService],
})
export class CallModule {}

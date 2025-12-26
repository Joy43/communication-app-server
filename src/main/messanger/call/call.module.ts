import { Module } from '@nestjs/common';
import { CallController } from './controller/call.controller';
import { CallService } from './service/call.service';

@Module({
  controllers: [CallController],
  providers: [CallService],
})
export class CallModule {}

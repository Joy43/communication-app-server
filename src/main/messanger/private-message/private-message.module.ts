import { Module } from '@nestjs/common';
import { PrivateMessageController } from './controller/private-message.controller';
import { PrivateMessageService } from './service/private-message.service';

@Module({
  controllers: [PrivateMessageController],
  providers: [PrivateMessageService],
})
export class PrivateMessageModule {}

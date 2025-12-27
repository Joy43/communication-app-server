import { FileService } from '@/lib/file/services/file.service';
import { Module } from '@nestjs/common';
import { PrivateChatController } from './controller/private-message.controller';
import { PrivateChatGateway } from './message-gateway/message-gateway';
import { PrivateChatService } from './service/private-message.service';

@Module({
  controllers: [PrivateChatController],
  providers: [PrivateChatService, FileService, PrivateChatGateway],
})
export class PrivateMessageModule {}

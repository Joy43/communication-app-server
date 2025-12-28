import { FileService } from '@/lib/file/services/file.service';
import { forwardRef, Module } from '@nestjs/common';
import { CallModule } from '../call/call.module';
import { PrivateChatController } from './controller/private-message.controller';
import { PrivateChatGateway } from './message-gateway/message-gateway';
import { PrivateChatService } from './service/private-message.service';

@Module({
  imports: [forwardRef(() => CallModule)],
  controllers: [PrivateChatController],
  providers: [PrivateChatService, FileService, PrivateChatGateway],
  exports: [PrivateChatGateway],
})
export class PrivateMessageModule {}

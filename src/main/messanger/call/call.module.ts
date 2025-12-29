import { forwardRef, Module } from '@nestjs/common';

import { PrivateMessageModule } from '../private-message/private-message.module';
import { CallService } from './service/call.service';
import { CallController } from './controller/call.controller';

@Module({
  imports: [forwardRef(() => PrivateMessageModule)],
  controllers:[CallController],
  providers: [CallService],
  exports: [CallService],
})
export class CallModule {}

import { forwardRef, Module } from '@nestjs/common';

import { PrivateMessageModule } from '../private-message/private-message.module';
import { CallService } from './service/call.service';

@Module({
  imports: [forwardRef(() => PrivateMessageModule)],
  providers: [CallService],
  exports: [CallService],
})
export class CallModule {}

import { Module } from '@nestjs/common';

import { PrivateMessageModule } from './private-message/private-message.module';
import { CallModule } from './call/call.module';

@Module({
  imports: [PrivateMessageModule, CallModule],
})
export class MessangerModule {}

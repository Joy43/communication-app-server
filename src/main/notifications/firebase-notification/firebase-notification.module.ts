import { Module } from '@nestjs/common';

import { FirebaseNotificationController } from './firebase-notification.controller';
import { FirebaseNotificationService } from './firebase-notification.service';

@Module({
  controllers: [FirebaseNotificationController],
  providers: [FirebaseNotificationService],
})
export class FirebaseNotificationModule {}

import { Module } from '@nestjs/common';

import { FirebaseModule } from '@/lib/firebase/firebase.module';
import { FirebaseNotificationModule } from './firebase-notification/firebase-notification.module';
import { SocketioNotificationModule } from './socketio-notification/socketio-notification.module';

@Module({
  controllers: [],
  providers: [],
  imports: [
    FirebaseNotificationModule,
    SocketioNotificationModule,
    FirebaseModule,
  ],
})
export class NotificationsModule {}

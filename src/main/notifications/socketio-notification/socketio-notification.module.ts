import { Module } from '@nestjs/common';
import { NotificationSettingController } from './socketio-notification.controller';
import { NotificationSettingService } from './socketio-notification.service';


@Module({
  controllers: [NotificationSettingController],
  providers: [ NotificationSettingService],
})
export class SocketioNotificationModule {}

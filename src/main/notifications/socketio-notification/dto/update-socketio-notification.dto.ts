import { PartialType } from '@nestjs/swagger';
import { CreateSocketioNotificationDto } from './create-socketio-notification.dto';

export class UpdateSocketioNotificationDto extends PartialType(CreateSocketioNotificationDto) {}

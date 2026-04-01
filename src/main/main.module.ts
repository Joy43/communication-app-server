import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { MessangerModule } from './messanger/messanger.module';
import { PostModule } from './post/post.module';
import { ProfileModule } from './profile/profile.module';
import { CommunityModule } from './community/community.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [AuthModule, UploadModule, MessangerModule, PostModule, ProfileModule, CommunityModule, NotificationsModule],
})
export class MainModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { MessangerModule } from './messanger/messanger.module';
import { PostModule } from './post/post.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [AuthModule, UploadModule, MessangerModule, PostModule, ProfileModule],
})
export class MainModule {}

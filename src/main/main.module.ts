import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { MessangerModule } from './messanger/messanger.module';

@Module({
  imports: [AuthModule, UploadModule, MessangerModule],
})
export class MainModule {}

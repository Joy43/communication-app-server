import { Module } from '@nestjs/common';
import { CludinaryUploadController } from './controller/cludinary-upload.controller';
import { UploadController } from './controller/upload-aws.controller';
import { CludinaryUploadService } from './service/cludinary-upload.service';
import { UploadService } from './service/upload-aws.service';

@Module({
  controllers: [UploadController, CludinaryUploadController],
  providers: [UploadService, CludinaryUploadService],
  exports: [CludinaryUploadService], // Export for use in other modules
})
export class UploadModule {}

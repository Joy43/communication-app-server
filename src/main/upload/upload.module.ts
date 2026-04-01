import { Module } from '@nestjs/common';
import { CludinaryUploadController } from './controller/cludinary-upload.controller';
import { UploadController } from './controller/upload.controller';
import { CludinaryUploadService } from './service/cludinary-upload.service';
import { UploadService } from './service/upload.service';

@Module({
  controllers: [UploadController, CludinaryUploadController],
  providers: [UploadService, CludinaryUploadService],
  exports: [CludinaryUploadService], // Export for use in other modules
})
export class UploadModule {}

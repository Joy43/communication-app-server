import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import {
  UploadFilesResponseDto,
  UploadedFileDto,
} from '../dto/upload-file-response.dto';

@Injectable()
export class CludinaryUploadService {
  private readonly logger = new Logger(CludinaryUploadService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('Cloud_Name');
    const apiKey = this.configService.get<string>('API_key');
    const apiSecret = this.configService.get<string>('API_Secret');
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  /**
   * Upload a single file to Cloudinary
   */
  async uploadSingleFile(file: Express.Multer.File): Promise<UploadedFileDto> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const maxFileSize = 100 * 1024 * 1024;
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File size exceeds maximum limit of 100MB`,
        );
      }

      // Determine resource type based on MIME type
      const resourceType = this.getResourceType(file.mimetype);
      const stream = Readable.from(file.buffer);

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder: 'communication-app',
            filename_override: file.originalname.split('.')[0],
            use_filename: true,
            unique_filename: true, // Ensure unique filenames
            tags: ['communication-app', resourceType],
          },
          (error, result) => {
            if (error) {
              this.logger.error(`Cloudinary upload failed: ${error.message}`);
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        stream.pipe(uploadStream);
      });

      return this.mapCloudinaryResponseToDto(result, file);
    } catch (error) {
      this.logger.error(`Error uploading file to Cloudinary: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to upload file to Cloudinary',
      );
    }
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
  ): Promise<UploadFilesResponseDto> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      if (files.length > 10) {
        throw new BadRequestException('Maximum 10 files allowed per request');
      }

      // Validate all files before uploading
      for (const file of files) {
        this.validateFile(file);
      }

      // Upload all files in parallel
      const uploadPromises = files.map((file) => this.uploadSingleFile(file));
      const uploadedFiles = await Promise.allSettled(uploadPromises);

      //  ------- Process results -------
      const successfulUrls: string[] = [];
      const failedUploads: { file: string; error: string }[] = [];

      uploadedFiles.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUrls.push(result.value.url);
        } else {
          failedUploads.push({
            file: files[index].originalname,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      //  ------- If all uploads failed, throw error -------
      if (successfulUrls.length === 0) {
        throw new InternalServerErrorException(
          `All files failed to upload: ${failedUploads.map((f) => f.file).join(', ')}`,
        );
      }

      return {
        urls: successfulUrls,
      };
    } catch (error) {
      this.logger.error(`Error uploading multiple files: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to upload files to Cloudinary',
      );
    }
  }

  /**
   * Determine Cloudinary resource type based on MIME type
   */
  private getResourceType(
    mimetype: string,
  ): 'image' | 'video' | 'raw' | 'auto' {
    if (mimetype.startsWith('image/')) {
      return 'image';
    }
    if (mimetype.startsWith('video/')) {
      return 'video';
    }
    if (mimetype.startsWith('audio/')) {
      return 'video';
    }
    return 'auto';
  }

  /**
   *  -------- Validate file before upload -------
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File "${file.originalname}" exceeds maximum size of 100MB`,
      );
    }

    //  ------- Allowed MIME types -------
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed`,
      );
    }
  }

  /**
   * Map Cloudinary response to DTO
   */
  private mapCloudinaryResponseToDto(
    result: any,
    file: Express.Multer.File,
  ): UploadedFileDto {
    const fileType =
      result.resource_type === 'image'
        ? 'image'
        : result.resource_type === 'video'
          ? 'video'
          : 'document';

    return {
      filename: result.public_id,
      originalFilename: file.originalname,
      path: result.public_id,
      url: result.secure_url,
      fileType: fileType as any,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Delete a file from Cloudinary (optional utility method)
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Cloudinary: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to delete file from Cloudinary',
      );
    }
  }
}

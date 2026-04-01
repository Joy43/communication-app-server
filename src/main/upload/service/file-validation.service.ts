import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ALL_SUPPORTED_MIME_TYPES,
  defaultCloudinaryUploadOptions,
} from '../config/cloudinary.config';

/**
 -------  File validation utility for Cloudinary uploads -------
 */
@Injectable()
export class FileValidationService {
  /**
   -------  Validate a single file -------
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

   
    const maxFileSize =
      defaultCloudinaryUploadOptions.max_file_size || 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${maxFileSize / (1024 * 1024)}MB`,
      );
    }


    if (!ALL_SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Supported types: ${ALL_SUPPORTED_MIME_TYPES.join(', ')}`,
      );
    }


    if (!file.originalname || file.originalname.length === 0) {
      throw new BadRequestException('Invalid filename');
    }
  }

  /**
   * ------- Validate multiple files -------
   */
  validateFiles(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const maxFilesPerRequest =
      defaultCloudinaryUploadOptions.max_files_per_request || 10;
    if (files.length > maxFilesPerRequest) {
      throw new BadRequestException(
        `Maximum ${maxFilesPerRequest} files allowed per request`,
      );
    }

    files.forEach((file, index) => {
      try {
        this.validateFile(file);
      } catch (error) {
        throw new BadRequestException(
          `File ${index + 1} (${file.originalname}) validation failed: ${error instanceof BadRequestException ? error.message : 'Unknown error'}`,
        );
      }
    });
  }

  /**
   -------  Get file extension from MIME type -------
   */
  getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/mpeg': 'mpeg',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'video/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/webm': 'webm',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
    };

    return mimeToExt[mimeType] || 'bin';
  }

  /**
   --------  Check if file is an image -------
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }
  isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }


  isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }
  isDocument(mimeType: string): boolean {
    return (
      mimeType === 'application/pdf' ||
      mimeType === 'application/msword' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  }
}

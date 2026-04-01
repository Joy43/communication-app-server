import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadFilesResponseDto } from '../dto/upload-file-response.dto';
import { CludinaryUploadService } from '../service/cludinary-upload.service';

@ApiTags('Cloudinary Upload --------------- Upload files to Cloudinary')
@Controller('upload-files')
export class CludinaryUploadController {
  constructor(
    private readonly cloudinaryUploadService: CludinaryUploadService,
  ) {}

  /**
   * ------- Upload a single file to Cloudinary -------
   */
  @Post('cloudinary/single')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Single file to upload',
        },
      },
      required: ['file'],
    },
  })
  async uploadSingleFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.cloudinaryUploadService.uploadSingleFile(file);
  }

  /**
   * ------- Upload multiple files to Cloudinary -------

   */
  @ApiOperation({ summary: 'Upload multiple files to Cloudinary (max 10 files)' })
  @Post('cloudinary')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple files to upload (up to 10 files)',
        },
      },
      required: ['files'],
    },
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadFilesResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed per request');
    }

    return this.cloudinaryUploadService.uploadMultipleFiles(files);
  }
}

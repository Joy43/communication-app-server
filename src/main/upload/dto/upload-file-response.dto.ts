import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '@prisma';

export class UploadedFileDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000.mp4' })
  filename: string;

  @ApiProperty({ example: 'my-video.mp4' })
  originalFilename: string;

  @ApiProperty({ example: 'videos/123e4567-e89b-12d3-a456-426614174000.mp4' })
  path: string;

  @ApiProperty({
    example:
      'https://bucket-name.s3.region.amazonaws.com/videos/123e4567-e89b-12d3-a456-426614174000.mp4',
  })
  url: string;

  @ApiProperty({ enum: FileType, example: FileType.video })
  fileType: FileType;

  @ApiProperty({ example: 'video/mp4' })
  mimeType: string;

  @ApiProperty({ example: 1048576 })
  size: number;
}

export class UploadFilesResponseDto {
  @ApiProperty({
    type: [String],
    example: [
      'https://res.cloudinary.com/xyz/image/upload/v123/file1.jpg',
      'https://res.cloudinary.com/xyz/image/upload/v124/file2.png',
      'https://res.cloudinary.com/xyz/image/upload/v125/file3.jpg',
    ],
  })
  urls: string[];
}

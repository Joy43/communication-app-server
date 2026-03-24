import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';


export class CreateProfileDto {
  @ApiProperty({
    description: 'The username of the profile',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'The title of the profile',
    example: 'Software Engineer',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    description: 'The bio of the profile',
    example: 'Passionate about coding and technology.',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({
    description: 'The avatar url of the profile',
    example: 'https://example.com/default-avatar.png',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: 'The cover url of the profile',
    example: 'https://example.com/default-cover.png',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  coverUrl?: string;

  @ApiProperty({
    description: 'The location of the profile',
    example: 'New York, USA',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'The gender of the user',
    enum: Gender,
    required: false,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    description: 'The date of birth of the profile',
    example: '1990-01-01',
    required: false,
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'Working experience or current company',
    example: '5 years at Google',
    required: false,
  })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiProperty({
    description: 'Toggle notifications for the profile',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isToggleNotification?: boolean;
}

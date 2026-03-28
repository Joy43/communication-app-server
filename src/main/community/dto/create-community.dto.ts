import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

enum CommunityType {
  ENVIRONMENT = 'ENVIRONMENT',
  EDUCATION = 'EDUCATION',
  HEALTH = 'HEALTH',
  ANIMAL_WELFARE = 'ANIMAL_WELFARE',
  HUMAN_RIGHTS = 'HUMAN_RIGHTS',
  DISASTER_RELIEF = 'DISASTER_RELIEF',
  ARTS_CULTURE = 'ARTS_CULTURE',
  SPORTS_RECREATION = 'SPORTS_RECREATION',
  TECHNOLOGY_INNOVATION = 'TECHNOLOGY_INNOVATION',
  OTHER = 'OTHER',
}

export class CreateCommunityDto {
  @ApiProperty({
    description: 'Community name',
    example: 'Tech Innovators',
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Community name must be at least 3 characters' })
  @MaxLength(100, { message: 'Community name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Community type',
    enum: CommunityType,
    example: CommunityType.TECHNOLOGY_INNOVATION,
  })
  @IsNotEmpty()
  @IsEnum(CommunityType, {
    message: `Community type must be one of: ${Object.values(CommunityType).join(', ')}`,
  })
  communityType: CommunityType;

  @ApiProperty({
    description: 'Community foundation date',
    example: '2024-01-15',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate({ message: 'Foundation date must be a valid date' })
  foundationDate: Date;

  @ApiProperty({
    description: 'Community profile image URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Profile image must be a valid URL' })
  profileImage?: string;

  @ApiProperty({
    description: 'Community banner image URL',
    example: 'https://example.com/banner.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Banner image must be a valid URL' })
  bannerImage?: string;

  @ApiProperty({
    description: 'Community bio/description',
    example: 'A community for technology innovators and developers',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bio must not exceed 1000 characters' })
  bio?: string;

  @ApiProperty({
    description: 'Community website URL',
    example: 'https://techcommunity.com',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @ApiProperty({
    description: 'Community location',
    example: 'San Francisco, CA',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Location must not exceed 200 characters' })
  location?: string;

  @ApiProperty({
    description: 'Community mission statement',
    example: 'Empowering innovators to build the future',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Mission must not exceed 2000 characters' })
  mission?: string;

  @ApiProperty({
    description: 'Enable notifications for members',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isToggleNotification?: boolean;
}

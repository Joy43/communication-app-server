import { ApiProperty } from '@nestjs/swagger';
import { MediaType, PostFrom, PostVisibility } from '@prisma';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateDedicatedAdInputDto {
  @ApiProperty({
    description: 'Title of the ad',
    example: 'Summer Sale',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Description of the ad',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Ad URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  adUrl?: string;

  @ApiProperty({
    description: 'Budget for the ad',
    required: false,
  })
  @IsOptional()
  budget?: number;
}

export class CreatePostDto {
  //---- example -----
  @ApiProperty({
    description: 'The text content of the post',
    example: 'This is a sample post content.',
    required: false,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @ApiProperty({
    description: 'The media URLs associated with the post',
    example: [
      'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1000',
      'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1000',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiProperty({
    description: 'The type of media associated with the post',
    example: MediaType.IMAGE,
    required: false,
  })
  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @ApiProperty({
    description: 'The visibility of the post',
    example: PostVisibility.PUBLIC,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiProperty({
    description: 'The source of the post',
    example: PostFrom.REGULAR_PROFILE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostFrom)
  postFrom?: PostFrom;

  @ApiProperty({
    description: 'The ID of the category associated with the post',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'The ID of the community associated with the post',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  communityId?: string;

  @ApiProperty({
    description: 'Whether the post accepts volunteer applications',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  acceptVolunteer?: boolean;

  @ApiProperty({
    description: 'Whether the post accepts donations',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  acceptDonation?: boolean;

  //------  Tagged Users ---------
  @ApiProperty({
    description: 'The IDs of users tagged in the post',
    example: [
      'c8f1b83e-65f4-4ba0-b810-7682980fcc87',
      '88e3ff3c-8f12-4e18-9cdd-71cef072da92',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  taggedUserIds?: string[];

  //------  Dedicated Ads --------
  @ApiProperty({
    description: 'Dedicated ads associated with the post',
    type: [CreateDedicatedAdInputDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDedicatedAdInputDto)
  dedicatedAds?: CreateDedicatedAdInputDto[];
}

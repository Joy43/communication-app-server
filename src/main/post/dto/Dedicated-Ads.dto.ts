import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDedicatedAdDto {
  @ApiProperty({
    description: 'Title of the ad',
    example: 'Summer Sale',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Description of the ad',
    example: 'Check out our amazing summer collection',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'URL where the ad links to',
    example: 'https://example.com/summer-sale',
    required: false,
  })
  @IsOptional()
  @IsString()
  adUrl?: string;

  @ApiProperty({
    description: 'Budget for the ad in dollars',
    example: 1000.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiProperty({
    description: 'Whether the ad is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDedicatedAdDto {
  @ApiProperty({
    description: 'Title of the ad',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Description of the ad',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'URL where the ad links to',
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
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiProperty({
    description: 'Whether the ad is active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'ssjoy43@gmail.com',
    description: 'Valid email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'joy',
    description: 'Name',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '12345678',
    description: 'Password (min 6 characters)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '12345678',
    description: 'locationLon',
  })
  @IsOptional()
  locationLon: string;

  @ApiProperty({
    example: '12345678',
    description: 'locationLat',
  })
  @IsOptional()
  locationLat: string;
}

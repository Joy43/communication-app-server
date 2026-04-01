import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user1@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '12345678',
    description: 'User password (min 6 characters)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
  // -----fcmToken-----
  @ApiProperty({
    example: '1RERR23FFERE456RER78',
    description: 'fcmToken',
  })
  @IsOptional()
  fcmToken: string;
}

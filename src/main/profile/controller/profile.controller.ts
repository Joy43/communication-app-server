import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileService } from '../service/profile.service';
import { GetUser, ValidateAuth, ValidateUser } from '@/core/jwt/jwt.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ----- update or crate profile ------
  @ApiOperation({ summary: 'Create or update user profile' })
  @ValidateUser()
  @ApiBearerAuth()
  @Patch('update-profile')
  createProfile(@Body() createProfileDto: CreateProfileDto
,@GetUser('sub') userId:string
) {
    return this.profileService.createProfile(createProfileDto,userId);
  }


}

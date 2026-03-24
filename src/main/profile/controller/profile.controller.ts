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
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ----- update or crate profile ------
  @ValidateUser()
  @ApiBearerAuth()
  @Patch('create-profile')
  createProfile(@Body() createProfileDto: CreateProfileDto
,@GetUser('sub') userId:string
) {
    return this.profileService.createProfile(createProfileDto,userId);
  }

  @Get()
  findAll() {
    return this.profileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(+id, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }
}

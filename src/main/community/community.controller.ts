import { GetUser, ValidateUser } from '@/core/jwt/jwt.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { get } from 'http';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @ValidateUser()
  @ApiBearerAuth()
  @Post('create')
  createCommunity(@Body() createCommunityDto: CreateCommunityDto, @GetUser('sub') userId: string) {
    return this.communityService.createCommunity(createCommunityDto, userId);
  }

  @Get('all-communities')
  findAllCommunities(@Body() paginationDto: PaginationDto) {
    return this.communityService.findAllCommunities(paginationDto);
  }

  @ValidateUser()
  @ApiBearerAuth()
  @Get(':id')
  getCommunity(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.communityService.getCommunity(id, userId);
  }




}

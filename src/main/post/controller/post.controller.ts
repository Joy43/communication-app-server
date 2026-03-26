import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { PostService } from '../service/post.service';
import { GetUser, ValidateUser } from '@/core/jwt/jwt.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ValidateUser()
  @ApiBearerAuth()
  @Post()
  createPost(@Body() createPostDto: CreatePostDto,@GetUser('sub') userId:string) {
    return this.postService.createPost(createPostDto,userId);
  }
//------------- CRUD operations for testing -------------
  @Get()
  findAll() {
    return this.postService.findAll();
  }

 
}

import { GetUser, ValidateUser } from '@/core/jwt/jwt.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/create-category.dto';
import { CreatePostDto } from '../dto/create-post.dto';
import {
  CreateDedicatedAdDto,
  UpdateDedicatedAdDto,
} from '../dto/Dedicated-Ads.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostService } from '../service/post.service';

@ApiTags('Posts')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // ==================== POST ENDPOINTS ====================

  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @Post('create-post')
  createPost(
    @Body() createPostDto: CreatePostDto,
    @GetUser('sub') userId: string,
  ) {
    return this.postService.createPost(createPostDto, userId);
  }

  @ApiOperation({ summary: 'Get all public posts' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @Get('/get-all-posts')
  getPosts(@Query() pagination: PaginationDto) {
    return this.postService.getPosts(pagination);
  }

  @ApiOperation({ summary: 'Get a specific post by ID' })
  @Get(':postId')
  getPostById(@Param('postId') postId: string) {
    return this.postService.getPostById(postId);
  }

  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user posts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('user/my-posts')
  getUserPosts(
    @GetUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.postService.getUserPosts(userId, pagination);
  }

  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @Patch(':postId')
  updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @GetUser('sub') userId: string,
  ) {
    return this.postService.updatePost(postId, updatePostDto, userId);
  }

  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post (soft delete)' })
  @HttpCode(HttpStatus.OK)
  @Delete(':postId')
  deletePost(@Param('postId') postId: string, @GetUser('sub') userId: string) {
    return this.postService.deletePost(postId, userId);
  }

  // ==================== CATEGORY ENDPOINTS ====================

  @ApiTags('Categories')
  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post category' })
  @Post('category/create')
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @GetUser('sub') userId: string,
  ) {
    return this.postService.createCategory(createCategoryDto, userId);
  }

  @ApiTags('Categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('category/all')
  getCategories(@Query() pagination: PaginationDto) {
    return this.postService.getCategories(pagination);
  }

  @ApiTags('Categories')
  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  @Patch('category/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.postService.updateCategory(categoryId, updateCategoryDto);
  }

  // ==================== DEDICATED ADS ENDPOINTS ====================

  @ApiTags('Ads')
  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a dedicated ad for a post' })
  @Post(':postId/ads')
  createDedicatedAd(
    @Param('postId') postId: string,
    @Body() createAdDto: CreateDedicatedAdDto,
    @GetUser('sub') userId: string,
  ) {
    return this.postService.createDedicatedAd(postId, createAdDto, userId);
  }
//-------- get ads -------------
  @ApiTags('Ads')
  @ApiOperation({ summary: 'Get all active ads' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('ads/all')
  getAds(@Query() pagination: PaginationDto) {
    return this.postService.getAds(pagination);
  }
//-------- follow -------------
  @ApiTags('Ads')
  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a dedicated ad' })
  @Patch('ads/:adId')
  updateDedicatedAd(
    @Param('adId') adId: string,
    @Body() updateAdDto: UpdateDedicatedAdDto,
    @GetUser('sub') userId: string,
  ) {
    return this.postService.updateDedicatedAd(adId, updateAdDto, userId);
  }
//-------- delete ads  -------------
  @ApiTags('Ads')
  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a dedicated ad' })
  @Delete('ads/:adId')
  deleteDedicatedAd(
    @Param('adId') adId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.postService.deleteDedicatedAd(adId, userId);
  }

  // ==================== FOLLOW ENDPOINTS ====================

  @ApiTags('Follow')
  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @Post('follow/:targetUserId')
  followUser(
    @Param('targetUserId') targetUserId: string,
    @GetUser('sub') currentUserId: string,
  ) {
    return this.postService.followUser(targetUserId, currentUserId);
  }
//-------- follow -------------
  @ApiTags('Follow')
  @ValidateUser()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @Delete('follow/:targetUserId')
  unfollowUser(
    @Param('targetUserId') targetUserId: string,
    @GetUser('sub') currentUserId: string,
  ) {
    return this.postService.unfollowUser(targetUserId, currentUserId);
  }
//------- follow -------------
  @ApiTags('Follow')
  @ApiOperation({ summary: "Get a user's followers" })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('followers/:userId')
  getFollowers(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.postService.getFollowers(userId, pagination);
  }
//------- follow -------------
  @ApiTags('Follow')
  @ApiOperation({ summary: 'Get users a user is following' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('following/:userId')
  getFollowing(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.postService.getFollowing(userId, pagination);
  }
//-------- follow -------------
  @ApiTags('Follow')
  @ApiOperation({ summary: 'Check if current user follows target user' })
  @ValidateUser()
  @ApiBearerAuth()
  @Get('follow-status/:targetUserId')
  isFollowing(
    @Param('targetUserId') targetUserId: string,
    @GetUser('sub') currentUserId: string,
  ) {
    return this.postService.isFollowing(targetUserId, currentUserId);
  }
}

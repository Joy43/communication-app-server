import { HandleError } from '@/core/error/handle-error.decorator';
import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== POST OPERATIONS ====================

  @HandleError('Failed to create post')
  async createPost(dto: CreatePostDto, userId: string) {
    const { taggedUserIds, dedicatedAds, ...rest } = dto;

    // ------- Prevent empty post ------
    if (!dto.text && (!dto.mediaUrls || dto.mediaUrls.length === 0)) {
      throw new BadRequestException(
        'Post cannot be empty. Provide text or media.',
      );
    }

    // Validate referenced resources exist
    if (dto.categoryId) {
      const category = await this.prisma.client.postCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    if (dto.communityId) {
      const community = await this.prisma.client.community.findUnique({
        where: { id: dto.communityId },
      });
      if (!community) {
        throw new BadRequestException('Community not found');
      }
    }

    const post = await this.prisma.client.post.create({
      data: {
        ...rest,
        authorId: userId,

        // ------ Tagged Users ------
        taggedUsers: taggedUserIds?.length
          ? {
              create: taggedUserIds.map((id) => ({
                userId: id,
              })),
            }
          : undefined,

        // -------Dedicated Ads -------
        dedicatedAd: dedicatedAds?.length
          ? {
              create: dedicatedAds.map((ad) => ({
                title: ad.title,
                description: ad.description,
                adUrl: ad.adUrl,
                budget: ad.budget ?? 0,
                isActive: true,
              })),
            }
          : undefined,

        // Auto create metrics
        metrics: {
          create: {},
        },
      },

      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        taggedUsers: true,
        dedicatedAd: true,
        metrics: true,
      },
    });

    return {
      message: 'Post created successfully',
      data: post,
    };
  }

  @HandleError('Failed to fetch posts')
  async getPosts(pagination: PaginationDto, userId?: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const skip = (page - 1) * limit;

    const posts = await this.prisma.client.post.findMany({
      where: {
        visibility: 'PUBLIC',
        isHidden: false,
      },
      select: {
        id: true,
        text: true,
        mediaUrls: true,
        mediaType: true,
        visibility: true,
        postFrom: true,
        authorId: true,
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        categoryId: true,
        communityId: true,
        acceptVolunteer: true,
        acceptDonation: true,
        isHidden: true,
        metrics: {
          select: {
            totalLikes: true,
            totalComments: true,
            totalShares: true,
            totalViews: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.client.post.count({
      where: {
        visibility: 'PUBLIC',
        isHidden: false,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Posts fetched successfully',
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  @HandleError('Failed to fetch post')
  async getPostById(postId: string) {
    const post = await this.prisma.client.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        taggedUsers: true,
        dedicatedAd: true,
        metrics: true,
        comments: {
          select: {
            id: true,
            text: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      message: 'Post fetched successfully',
      data: post,
    };
  }

  @HandleError('Failed to update post')
  async updatePost(postId: string, dto: UpdatePostDto, userId: string) {
    const post = await this.prisma.client.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new BadRequestException('You can only update your own posts');
    }

    const updatedPost = await this.prisma.client.post.update({
      where: { id: postId },
      data: dto,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        metrics: true,
      },
    });

    return {
      message: 'Post updated successfully',
      data: updatedPost,
    };
  }

  @HandleError('Failed to delete post')
  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.client.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new BadRequestException('You can only delete your own posts');
    }

    // Soft delete
    await this.prisma.client.post.update({
      where: { id: postId },
      data: { isHidden: true },
    });

    return {
      message: 'Post deleted successfully',
      data: null,
    };
  }

  @HandleError('Failed to get user posts')
  async getUserPosts(userId: string, pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const skip = (page - 1) * limit;

    const posts = await this.prisma.client.post.findMany({
      where: {
        authorId: userId,
      },
      select: {
        id: true,
        text: true,
        mediaUrls: true,
        visibility: true,
        metrics: {
          select: {
            totalLikes: true,
            totalComments: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.client.post.count({
      where: { authorId: userId },
    });

    return {
      message: 'User posts fetched successfully',
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== TAG OPERATIONS (Currently using PostCategory) ====================
  // Note: If you need a separate Tag/Hashtag model, add it to the schema

  // For now, tags are managed through PostCategory
  // You can create tags by creating categories

  // ==================== CATEGORY OPERATIONS ====================

  @HandleError('Failed to create category')
  async createCategory(dto: CreateCategoryDto, userId: string) {
    const { name, description } = dto;

    // Check for duplicate
    const existingCategory = await this.prisma.client.postCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      throw new BadRequestException('Category already exists');
    }

    const category = await this.prisma.client.postCategory.create({
      data: {
        name,
        description,
      },
    });

    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  @HandleError('Failed to fetch categories')
  async getCategories(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const categories = await this.prisma.client.postCategory.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.client.postCategory.count();

    return {
      message: 'Categories fetched successfully',
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @HandleError('Failed to update category')
  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.client.postCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updatedCategory = await this.prisma.client.postCategory.update({
      where: { id: categoryId },
      data: dto,
    });

    return {
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  // ==================== DEDICATED ADS OPERATIONS ====================

  @HandleError('Failed to create ad')
  async createDedicatedAd(
    postId: string,
    dto: CreateDedicatedAdDto,
    userId: string,
  ) {
    // Verify post exists and user is author
    const post = await this.prisma.client.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new BadRequestException('You can only add ads to your own posts');
    }

    const ad = await this.prisma.client.dedicatedAd.create({
      data: {
        postId,
        title: dto.title,
        description: dto.description,
        adUrl: dto.adUrl,
        budget: dto.budget ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      message: 'Ad created successfully',
      data: ad,
    };
  }

  @HandleError('Failed to fetch ads')
  async getAds(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const ads = await this.prisma.client.dedicatedAd.findMany({
      where: { isActive: true },
      skip,
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            text: true,
            authorId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.client.dedicatedAd.count({
      where: { isActive: true },
    });

    return {
      message: 'Ads fetched successfully',
      data: ads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @HandleError('Failed to update ad')
  async updateDedicatedAd(
    adId: string,
    dto: UpdateDedicatedAdDto,
    userId: string,
  ) {
    const ad = await this.prisma.client.dedicatedAd.findUnique({
      where: { id: adId },
      include: {
        post: true,
      },
    });

    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    if (ad.post.authorId !== userId) {
      throw new BadRequestException('You can only update your own ads');
    }

    const updatedAd = await this.prisma.client.dedicatedAd.update({
      where: { id: adId },
      data: dto,
    });

    return {
      message: 'Ad updated successfully',
      data: updatedAd,
    };
  }

  @HandleError('Failed to delete ad')
  async deleteDedicatedAd(adId: string, userId: string) {
    const ad = await this.prisma.client.dedicatedAd.findUnique({
      where: { id: adId },
      include: {
        post: true,
      },
    });

    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    if (ad.post.authorId !== userId) {
      throw new BadRequestException('You can only delete your own ads');
    }

    await this.prisma.client.dedicatedAd.delete({
      where: { id: adId },
    });

    return {
      message: 'Ad deleted successfully',
      data: null,
    };
  }

  // ==================== FOLLOW OPERATIONS ====================

  @HandleError('Failed to follow user')
  async followUser(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Verify target user exists
    const targetUser = await this.prisma.client.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.client.userFollow.findUnique({
      where: {
        followerId_followedId: {
          followerId: currentUserId,
          followedId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Already following this user');
    }

    await this.prisma.client.userFollow.create({
      data: {
        followerId: currentUserId,
        followedId: targetUserId,
      },
    });

    return {
      message: 'User followed successfully',
      data: null,
    };
  }

  @HandleError('Failed to unfollow user')
  async unfollowUser(targetUserId: string, currentUserId: string) {
    const follow = await this.prisma.client.userFollow.findUnique({
      where: {
        followerId_followedId: {
          followerId: currentUserId,
          followedId: targetUserId,
        },
      },
    });

    if (!follow) {
      throw new BadRequestException('You are not following this user');
    }

    await this.prisma.client.userFollow.delete({
      where: {
        followerId_followedId: {
          followerId: currentUserId,
          followedId: targetUserId,
        },
      },
    });

    return {
      message: 'User unfollowed successfully',
      data: null,
    };
  }

  @HandleError('Failed to fetch followers')
  async getFollowers(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const followers = await this.prisma.client.userFollow.findMany({
      where: { followedId: userId },
      select: {
        follower: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.client.userFollow.count({
      where: { followedId: userId },
    });

    return {
      message: 'Followers fetched successfully',
      data: followers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @HandleError('Failed to fetch following')
  async getFollowing(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const following = await this.prisma.client.userFollow.findMany({
      where: { followerId: userId },
      select: {
        followed: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.client.userFollow.count({
      where: { followerId: userId },
    });

    return {
      message: 'Following fetched successfully',
      data: following,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @HandleError('Failed to check follow status')
  async isFollowing(targetUserId: string, currentUserId: string) {
    const follow = await this.prisma.client.userFollow.findUnique({
      where: {
        followerId_followedId: {
          followerId: currentUserId,
          followedId: targetUserId,
        },
      },
    });

    return {
      message: 'Follow status fetched',
      data: {
        isFollowing: !!follow,
      },
    };
  }
}

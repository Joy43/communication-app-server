import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { GetUser } from '@/core/jwt/jwt.decorator';

@Injectable()
export class PostService {
  constructor(private readonly prisma:PrismaService){}
 async createPost(dto: CreatePostDto, userId: string) {
    const { taggedUserIds, dedicatedAds, ...rest } = dto;

    // ------- Prevent empty post ------
    if (!dto.text && (!dto.mediaUrls || dto.mediaUrls.length === 0)) {
      throw new BadRequestException('Post cannot be empty');
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

        // -------Dedicated Ads ------
        dedicatedAd: dedicatedAds?.length
          ? {
              create: dedicatedAds.map((ad) => ({
                title: ad.title,
                description: ad.description,
                adUrl: ad.adUrl,
                budget: ad.budget ?? 0,
              })),
            }
          : undefined,

        // ------- Auto create metrics ------
        metrics: {
          create: {},
        },
      },

      include: {
        author: true,
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

  findAll() {
    return `This action returns all post`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}

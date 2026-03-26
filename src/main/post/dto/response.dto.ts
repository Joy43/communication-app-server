import { ApiProperty } from '@nestjs/swagger';
import { MediaType, PostFrom, PostVisibility } from '@prisma';

export class PostMetricsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  totalLikes: number;

  @ApiProperty()
  totalComments: number;

  @ApiProperty()
  totalShares: number;

  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  revenueGenerated: number;
}

export class UserMinimalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text?: string;

  @ApiProperty()
  mediaUrls: string[];

  @ApiProperty()
  mediaType?: MediaType;

  @ApiProperty()
  visibility: PostVisibility;

  @ApiProperty()
  postFrom: PostFrom;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ type: UserMinimalResponseDto })
  author: UserMinimalResponseDto;

  @ApiProperty()
  categoryId?: string;

  @ApiProperty()
  communityId?: string;

  @ApiProperty()
  acceptVolunteer: boolean;

  @ApiProperty()
  acceptDonation: boolean;

  @ApiProperty()
  isHidden: boolean;

  @ApiProperty({ type: PostMetricsResponseDto })
  metrics?: PostMetricsResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TagResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DedicatedAdResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  adUrl?: string;

  @ApiProperty()
  budget: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ApiResponseDto<T> {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: T;
}

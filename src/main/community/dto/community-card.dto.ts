import { ApiProperty } from '@nestjs/swagger';

/**
 * Community Card DTO - Minimal data for displaying community in lists
 * Used for community feeds, search results, and discovery
 */
export class CommunityCardDto {
  @ApiProperty({
    description: 'Community unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Community name',
    example: 'Tech Innovators',
  })
  name: string;

  @ApiProperty({
    description: 'Community type',
    example: 'TECHNOLOGY_INNOVATION',
  })
  communityType: string;

  @ApiProperty({
    description: 'Community profile image',
    example: 'https://example.com/image.jpg',
  })
  profileImage?: string;

  @ApiProperty({
    description: 'Community bio/description',
    example: 'A community for technology innovators',
  })
  bio?: string;

  @ApiProperty({
    description: 'Is community verified',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Community cap level',
    example: 'GOLD',
  })
  capLevel: string;

  @ApiProperty({
    description: 'Number of members',
    example: 1500,
  })
  memberCount: number;

  @ApiProperty({
    description: 'Number of followers',
    example: 3000,
  })
  followerCount: number;

  @ApiProperty({
    description: 'Total likes/loves on community',
    example: 250,
  })
  likes: number;

  @ApiProperty({
    description: 'Is user member of community',
    example: true,
  })
  isMember?: boolean;

  @ApiProperty({
    description: 'Is user following community',
    example: true,
  })
  isFollowing?: boolean;

  @ApiProperty({
    description: 'User role in community',
    example: 'MEMBER',
  })
  userRole?: string;

  @ApiProperty({
    description: 'Community creation date',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;
}

/**
 * Detailed Community Response DTO
 * Used for viewing full community details
 */
export class CommunityDetailDto extends CommunityCardDto {
  @ApiProperty({
    description: 'Community owner ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Community owner info',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'john@example.com',
    },
  })
  owner?: any;

  @ApiProperty({
    description: 'Community foundation date',
    example: '2023-01-01T00:00:00Z',
  })
  foundationDate: Date;

  @ApiProperty({
    description: 'Community website',
    example: 'https://techcommunity.com',
  })
  website?: string;

  @ApiProperty({
    description: 'Community location',
    example: 'San Francisco, CA',
  })
  location?: string;

  @ApiProperty({
    description: 'Community mission',
    example: 'Empowering tech innovators',
  })
  mission?: string;

  @ApiProperty({
    description: 'Banner image URL',
    example: 'https://example.com/banner.jpg',
  })
  bannerImage?: string;

  @ApiProperty({
    description: 'Number of posts',
    example: 450,
  })
  postCount: number;

  @ApiProperty({
    description: 'Notification toggle status',
    example: true,
  })
  isToggleNotification: boolean;

  @ApiProperty({
    description: 'Last updated time',
    example: '2026-03-27T10:00:00Z',
  })
  updatedAt: Date;
}

/**
 * Community Member DTO
 * User info in context of community membership
 */
export class CommunityMemberDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'User name',
    example: 'Jane Smith',
  })
  userName: string;

  @ApiProperty({
    description: 'User email',
    example: 'jane@example.com',
  })
  userEmail: string;

  @ApiProperty({
    description: 'User profile image',
    example: 'https://example.com/user.jpg',
  })
  userProfileImage?: string;

  @ApiProperty({
    description: 'Member role in community',
    example: 'MODERATOR',
  })
  role: string;

  @ApiProperty({
    description: 'When user joined',
    example: '2024-02-01T10:00:00Z',
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Member status',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Is member banned',
    example: false,
  })
  isBanned?: boolean;

  @ApiProperty({
    description: 'Posts count by this member',
    example: 45,
  })
  postsCount: number;

  @ApiProperty({
    description: 'Engagement score',
    example: 850,
  })
  engagementScore: number;
}

/**
 * Community Statistics DTO
 * For analytics and dashboard
 */
export class CommunityStatsDto {
  @ApiProperty({
    description: 'Community ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  communityId: string;

  @ApiProperty({
    description: 'Total members',
    example: 1500,
  })
  totalMembers: number;

  @ApiProperty({
    description: 'Total followers',
    example: 3000,
  })
  totalFollowers: number;

  @ApiProperty({
    description: 'Total posts',
    example: 450,
  })
  totalPosts: number;

  @ApiProperty({
    description: 'Total comments',
    example: 2300,
  })
  totalComments: number;

  @ApiProperty({
    description: 'Total likes',
    example: 5600,
  })
  totalLikes: number;

  @ApiProperty({
    description: 'Growth rate (percentage)',
    example: 12.5,
  })
  growthRate: number;

  @ApiProperty({
    description: 'Engagement rate (percentage)',
    example: 23.4,
  })
  engagementRate: number;

  @ApiProperty({
    description: 'Average posts per day',
    example: 3.2,
  })
  avgPostsPerDay: number;

  @ApiProperty({
    description: 'Most active time',
    example: '14:00-18:00',
  })
  mostActiveTime: string;

  @ApiProperty({
    description: 'Top contributor',
    example: 'Jane Smith',
  })
  topContributor: string;
}

/**
 * Community Trending DTO
 * For trending communities list
 */
export class CommunityTrendingDto extends CommunityCardDto {
  @ApiProperty({
    description: 'Daily new members',
    example: 25,
  })
  dailyNewMembers: number;

  @ApiProperty({
    description: 'Daily posts',
    example: 15,
  })
  dailyPosts: number;

  @ApiProperty({
    description: 'Trending score',
    example: 950,
  })
  trendingScore: number;

  @ApiProperty({
    description: 'Rank in trending',
    example: 5,
  })
  trendingRank: number;

  @ApiProperty({
    description: 'Momentum (growth percentage)',
    example: 45.6,
  })
  momentum: number;
}

/**
 * Community Search Result DTO
 */
export class CommunitySearchResultDto extends CommunityCardDto {
  @ApiProperty({
    description: 'Relevance score',
    example: 0.95,
  })
  relevanceScore: number;

  @ApiProperty({
    description: 'Match reason',
    example: 'Name match with description',
  })
  matchReason: string;
}

/**
 * Community Invitation DTO
 */
export class CommunityInvitationDto {
  @ApiProperty({
    description: 'Invitation ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  invitationId: string;

  @ApiProperty({
    description: 'Community info',
    type: CommunityCardDto,
  })
  community: CommunityCardDto;

  @ApiProperty({
    description: 'Invited by user',
    example: 'John Doe',
  })
  invitedBy: string;

  @ApiProperty({
    description: 'Invitation message',
    example: 'Join us for amazing tech discussions!',
  })
  message?: string;

  @ApiProperty({
    description: 'Invitation status',
    example: 'PENDING',
  })
  status: string;

  @ApiProperty({
    description: 'Invitation creation date',
    example: '2026-03-27T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Invitation expiry date',
    example: '2026-04-27T10:00:00Z',
  })
  expiryDate: Date;
}

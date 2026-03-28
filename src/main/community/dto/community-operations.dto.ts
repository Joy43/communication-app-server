import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

enum CommunityRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

/**
 * DTO for joining a community
 * Used when a user wants to become a member
 */
export class JoinCommunityDto {
  @ApiProperty({
    description: 'Community ID to join',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  communityId: string;

  @ApiProperty({
    description: 'Reason for joining (optional)',
    example: 'I want to collaborate on tech projects',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * DTO for leaving a community
 */
export class LeaveCommunityDto {
  @ApiProperty({
    description: 'Community ID to leave',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  communityId: string;

  @ApiProperty({
    description: 'Reason for leaving (optional)',
    example: 'Moving to different community',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * DTO for updating member role in community
 * Admin only operation
 */
export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'User ID to update role for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'New role for the member',
    enum: CommunityRole,
    example: CommunityRole.MODERATOR,
  })
  @IsEnum(CommunityRole)
  role: CommunityRole;
}

/**
 * DTO for managing member permissions
 */
export class ManageMemberPermissionDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Can post in community',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canPost?: boolean;

  @ApiProperty({
    description: 'Can comment on posts',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canComment?: boolean;

  @ApiProperty({
    description: 'Can invite members',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canInvite?: boolean;

  @ApiProperty({
    description: 'Can moderate content',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canModerate?: boolean;
}

/**
 * DTO for liking/loving a community
 */
export class LikeCommunityDto {
  @ApiProperty({
    description: 'Community ID to like',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  communityId: string;
}

/**
 * DTO for following a community
 */
export class FollowCommunityDto {
  @ApiProperty({
    description: 'Community ID to follow',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  communityId: string;
}

/**
 * DTO for unfollowing a community
 */
export class UnfollowCommunityDto {
  @ApiProperty({
    description: 'Community ID to unfollow',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  communityId: string;
}

/**
 * DTO for inviting users to community
 */
export class InviteToCommunityDto {
  @ApiProperty({
    description: 'User IDs to invite',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
  })
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Custom invitation message',
    example: 'Join us for amazing tech discussions!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

/**
 * DTO for removing member from community
 * Admin only
 */
export class RemoveMemberDto {
  @ApiProperty({
    description: 'User ID to remove',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Reason for removal',
    example: 'Violating community guidelines',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * DTO for banning/unbanning members
 * Admin only
 */
export class BanMemberDto {
  @ApiProperty({
    description: 'User ID to ban',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Ban reason',
    example: 'Spam and harassment',
  })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiProperty({
    description: 'Ban duration in days (0 for permanent)',
    example: 7,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  banDurationDays?: number;
}

/**
 * DTO for verifying community
 * Admin/Super Admin only
 */
export class VerifyCommunityDto {
  @ApiProperty({
    description: 'Community ID to verify',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  communityId: string;

  @ApiProperty({
    description: 'Verification notes',
    example: 'Legitimate non-profit organization',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/**
 * DTO for updating community cap level
 * Based on engagement and community health
 */
export class UpdateCapLevelDto {
  @ApiProperty({
    description: 'New cap level',
    enum: ['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    example: 'GOLD',
  })
  @IsEnum(['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'])
  capLevel: string;

  @ApiProperty({
    description: 'Reason for cap level change',
    example: 'Reached 10k members milestone',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * DTO for toggling community notifications
 */
export class ToggleNotificationDto {
  @ApiProperty({
    description: 'Enable/disable notifications',
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;

  @ApiProperty({
    description: 'Notification types to toggle',
    type: [String],
    example: ['NEW_MEMBER', 'NEW_POST', 'ANNOUNCEMENT'],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  notificationTypes?: string[];
}

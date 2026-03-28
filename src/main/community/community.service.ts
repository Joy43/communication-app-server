import { HandleError } from '@/core/error/handle-error.decorator';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { PaginationDto } from '@/main/post/dto/pagination.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BanMemberDto,
  InviteToCommunityDto,
  RemoveMemberDto,
  ToggleNotificationDto,
  UpdateCapLevelDto,
  UpdateMemberRoleDto,
  VerifyCommunityDto,
} from './dto/community-operations.dto';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  @HandleError('Failed to create community')
  async createCommunity(dto: CreateCommunityDto, userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const community = await this.prisma.client.community.create({
      data: {
        communityType: dto.communityType,
        foundationDate: new Date(dto.foundationDate),
        ownerId: userId,
        isToggleNotification: dto.isToggleNotification ?? false,
        profile: {
          create: {
            bio: dto.bio,
            profileImage: dto.profileImage,
            bannerImage: dto.bannerImage,
            website: dto.website,
          },
        },
        about: {
          create: {
            location: dto.location,
            mission: dto.mission,
            website: dto.website,
            foundingDate: new Date(dto.foundationDate),
          },
        },
        memberships: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: { profile: true, about: true },
    });

    return {
      id: community.id,
      type: community.communityType,
      ownerId: community.ownerId,
      verified: community.isVerified,
      capLevel: community.capLevel,
      createdAt: community.createdAt,
    };
  }

  @HandleError('Failed to fetch community')
  async getCommunity(communityId: string, userId?: string) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
      include: {
        profile: true,
        about: true,
        _count: {
          select: {
            memberships: true,
            CommunityFollower: true,
            posts: true,
          },
        },
      },
    });

    if (!community) throw new NotFoundException('Community not found');

    let userRole = null;
    let isMember = false;
    let isFollowing = false;

    if (userId) {
      const membership =
        await this.prisma.client.communitiesMembership.findUnique({
          where: {
            userId_communityId: { userId, communityId },
          },
        });

      const follower = await this.prisma.client.communityFollower.findUnique({
        where: {
          userId_communityId: { userId, communityId },
        },
      });

      isMember = !!membership;
      userRole = membership?.role || null;
      isFollowing = !!follower;
    }

    return {
      id: community.id,
      type: community.communityType,
      ownerId: community.ownerId,
      verified: community.isVerified,
      capLevel: community.capLevel,
      likes: community.likes,
      bio: community.profile?.bio,
      profileImage: community.profile?.profileImage,
      bannerImage: community.profile?.bannerImage,
      website: community.profile?.website || community.about?.website,
      location: community.about?.location,
      mission: community.about?.mission,
      foundationDate: community.foundationDate,
      memberCount: community._count.memberships,
      followerCount: community._count.CommunityFollower,
      postCount: community._count.posts,
      isMember,
      userRole,
      isFollowing,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };
  }

  @HandleError('Failed to fetch communities')
  async findAllCommunities(
    pagination: PaginationDto,
    filters?: {
      type?: string;
      verified?: boolean;
      capLevel?: string;
      searchTerm?: string;
    },
    userId?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const sortBy = pagination.sortBy ?? 'createdAt';
    const sortOrder = pagination.sortOrder ?? 'desc';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.type) where.communityType = filters.type;
    if (filters?.verified !== undefined) where.isVerified = filters.verified;
    if (filters?.capLevel) where.capLevel = filters.capLevel;
    if (filters?.searchTerm) {
      where.OR = [
        {
          profile: {
            bio: { contains: filters.searchTerm, mode: 'insensitive' },
          },
        },
        {
          about: {
            mission: { contains: filters.searchTerm, mode: 'insensitive' },
          },
        },
      ];
    }

    const [communities, total] = await Promise.all([
      this.prisma.client.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          profile: true,
          _count: {
            select: { memberships: true, CommunityFollower: true },
          },
        },
      }),
      this.prisma.client.community.count({ where }),
    ]);

    let communityCards: any[] = [];

    if (userId) {
      const memberships =
        await this.prisma.client.communitiesMembership.findMany({
          where: {
            userId,
            communityId: { in: communities.map((c) => c.id) },
          },
        });

      const followers = await this.prisma.client.communityFollower.findMany({
        where: {
          userId,
          communityId: { in: communities.map((c) => c.id) },
        },
      });

      const membershipMap = new Map(
        memberships.map((m) => [m.communityId, m.role]),
      );
      const followerSet = new Set(followers.map((f) => f.communityId));

      communityCards = communities.map((community) => ({
        id: community.id,
        type: community.communityType,
        ownerId: community.ownerId,
        bio: community.profile?.bio,
        profileImage: community.profile?.profileImage,
        verified: community.isVerified,
        capLevel: community.capLevel,
        likes: community.likes,
        memberCount: community._count.memberships,
        followerCount: community._count.CommunityFollower,
        isMember: membershipMap.has(community.id),
        isFollowing: followerSet.has(community.id),
        userRole: membershipMap.get(community.id) || null,
        createdAt: community.createdAt,
      }));
    } else {
      communityCards = communities.map((community) => ({
        id: community.id,
        type: community.communityType,
        ownerId: community.ownerId,
        bio: community.profile?.bio,
        profileImage: community.profile?.profileImage,
        verified: community.isVerified,
        capLevel: community.capLevel,
        likes: community.likes,
        memberCount: community._count.memberships,
        followerCount: community._count.CommunityFollower,
        createdAt: community.createdAt,
      }));
    }

    return {
      data: communityCards,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @HandleError('Failed to update community')
  async updateCommunity(
    communityId: string,
    dto: UpdateCommunityDto,
    userId: string,
  ) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId !== userId) {
      throw new ForbiddenException('Only community owner can update');
    }

    const updated = await this.prisma.client.community.update({
      where: { id: communityId },
      data: {
        ...(dto.communityType && { communityType: dto.communityType }),
        ...(dto.foundationDate && {
          foundationDate: new Date(dto.foundationDate),
        }),
        ...(dto.isToggleNotification !== undefined && {
          isToggleNotification: dto.isToggleNotification,
        }),
      },
      include: { profile: true, about: true },
    });

    if (dto.profileImage || dto.bannerImage || dto.bio || dto.website) {
      await this.prisma.client.communityProfile.upsert({
        where: { communityId },
        create: {
          communityId,
          bio: dto.bio,
          profileImage: dto.profileImage,
          bannerImage: dto.bannerImage,
          website: dto.website,
        },
        update: {
          ...(dto.bio && { bio: dto.bio }),
          ...(dto.profileImage && { profileImage: dto.profileImage }),
          ...(dto.bannerImage && { bannerImage: dto.bannerImage }),
          ...(dto.website && { website: dto.website }),
        },
      });
    }

    if (dto.location || dto.mission) {
      await this.prisma.client.communityAbout.upsert({
        where: { communityId },
        create: {
          communityId,
          location: dto.location,
          mission: dto.mission,
          website: dto.website,
          foundingDate: new Date(
            dto.foundationDate || community.foundationDate,
          ),
        },
        update: {
          ...(dto.location && { location: dto.location }),
          ...(dto.mission && { mission: dto.mission }),
        },
      });
    }

    return {
      id: updated.id,
      type: updated.communityType,
      ownerId: updated.ownerId,
      updatedAt: updated.updatedAt,
    };
  }

  @HandleError('Failed to delete community')
  async deleteCommunity(communityId: string, userId: string) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId !== userId) {
      throw new ForbiddenException('Only community owner can delete');
    }

    await this.prisma.client.community.delete({ where: { id: communityId } });
    return { message: 'Community deleted successfully' };
  }

  @HandleError('Failed to join community')
  async joinCommunity(communityId: string, userId: string, reason?: string) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');

    const existingMembership =
      await this.prisma.client.communitiesMembership.findUnique({
        where: { userId_communityId: { userId, communityId } },
      });

    if (existingMembership) {
      throw new ConflictException('User is already a member');
    }

    const membership = await this.prisma.client.communitiesMembership.create({
      data: { userId, communityId, role: 'MEMBER' },
    });

    return {
      message: 'Successfully joined community',
      data: {
        communityId,
        userId,
        role: membership.role,
        joinedAt: membership.createdAt,
      },
    };
  }

  @HandleError('Failed to leave community')
  async leaveCommunity(communityId: string, userId: string, reason?: string) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId === userId) {
      throw new BadRequestException(
        'Owner cannot leave. Delete community instead.',
      );
    }

    await this.prisma.client.communitiesMembership.deleteMany({
      where: { userId, communityId },
    });
    await this.prisma.client.communityFollower.deleteMany({
      where: { userId, communityId },
    });

    return { message: 'Successfully left community' };
  }

  @HandleError('Failed to get community members')
  async getCommunityMembers(communityId: string, pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const sortBy = pagination.sortBy ?? 'createdAt';
    const sortOrder = pagination.sortOrder ?? 'desc';
    const skip = (page - 1) * limit;

    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });
    if (!community) throw new NotFoundException('Community not found');

    const [members, total] = await Promise.all([
      this.prisma.client.communitiesMembership.findMany({
        where: { communityId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { user: { include: { profile: true } } },
      }),
      this.prisma.client.communitiesMembership.count({
        where: { communityId },
      }),
    ]);

    const memberCards = members.map((member) => ({
      userId: member.userId,
      userName: member.user.profile?.username,
      userEmail: member.user.email,
      userProfileImage: member.user.profile?.avatarUrl,
      role: member.role,
      joinedAt: member.createdAt,
    }));

    return {
      data: memberCards,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  @HandleError('Failed to update member role')
  async updateMemberRole(
    communityId: string,
    dto: UpdateMemberRoleDto,
    userId: string,
  ) {
    const userMembership =
      await this.prisma.client.communitiesMembership.findUnique({
        where: { userId_communityId: { userId, communityId } },
      });

    if (
      !userMembership ||
      (userMembership.role !== 'ADMIN' && userMembership.role !== 'MODERATOR')
    ) {
      throw new ForbiddenException('Only admins can update roles');
    }

    const updated = await this.prisma.client.communitiesMembership.update({
      where: { userId_communityId: { userId: dto.userId, communityId } },
      data: { role: dto.role as any },
    });

    return {
      message: 'Member role updated',
      data: { userId: updated.userId, role: updated.role },
    };
  }

  @HandleError('Failed to remove member')
  async removeMember(
    communityId: string,
    dto: RemoveMemberDto,
    userId: string,
  ) {
    const userMembership =
      await this.prisma.client.communitiesMembership.findUnique({
        where: { userId_communityId: { userId, communityId } },
      });

    if (!userMembership || userMembership.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can remove members');
    }

    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId === dto.userId) {
      throw new BadRequestException('Cannot remove community owner');
    }

    await this.prisma.client.communitiesMembership.deleteMany({
      where: { userId: dto.userId, communityId },
    });

    return { message: 'Member removed successfully' };
  }

  @HandleError('Failed to like community')
  async likeCommunity(communityId: string, userId: string) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');

    const existingLike = await this.prisma.client.community.findFirst({
      where: { id: communityId, likers: { some: { id: userId } } },
    });

    if (existingLike) {
      await this.prisma.client.community.update({
        where: { id: communityId },
        data: {
          likes: { decrement: 1 },
          likers: { disconnect: { id: userId } },
        },
      });
      return { message: 'Community unliked', isLiked: false };
    } else {
      await this.prisma.client.community.update({
        where: { id: communityId },
        data: { likes: { increment: 1 }, likers: { connect: { id: userId } } },
      });
      return { message: 'Community liked', isLiked: true };
    }
  }

  @HandleError('Failed to follow community')
  async followCommunity(communityId: string, userId: string) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');

    const existingFollow =
      await this.prisma.client.communityFollower.findUnique({
        where: { userId_communityId: { userId, communityId } },
      });

    if (existingFollow)
      throw new ConflictException('Already following this community');

    await this.prisma.client.communityFollower.create({
      data: { userId, communityId },
    });
    return { message: 'Successfully followed community', isFollowing: true };
  }

  @HandleError('Failed to unfollow community')
  async unfollowCommunity(communityId: string, userId: string) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');

    await this.prisma.client.communityFollower.deleteMany({
      where: { userId, communityId },
    });
    return { message: 'Successfully unfollowed community', isFollowing: false };
  }

  @HandleError('Failed to get community followers')
  async getCommunityFollowers(communityId: string, pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const sortBy = pagination.sortBy ?? 'createdAt';
    const sortOrder = pagination.sortOrder ?? 'desc';
    const skip = (page - 1) * limit;

    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });
    if (!community) throw new NotFoundException('Community not found');

    const [followers, total] = await Promise.all([
      this.prisma.client.communityFollower.findMany({
        where: { communityId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { user: { include: { profile: true } } },
      }),
      this.prisma.client.communityFollower.count({ where: { communityId } }),
    ]);

    const followerCards = followers.map((follower) => ({
      userId: follower.userId,
      userName: follower.user.profile?.username,
      userEmail: follower.user.email,
      userProfileImage: follower.user.profile?.avatarUrl,
      followedAt: follower.createdAt,
    }));

    return {
      data: followerCards,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  @HandleError('Failed to invite members')
  async inviteMembers(
    communityId: string,
    dto: InviteToCommunityDto,
    userId: string,
  ) {
    const userMembership =
      await this.prisma.client.communitiesMembership.findUnique({
        where: { userId_communityId: { userId, communityId } },
      });

    if (!userMembership || userMembership.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can invite');
    }

    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');

    const invitedCount =
      await this.prisma.client.communitiesMembership.createMany({
        data: dto.userIds.map((invitedUserId) => ({
          userId: invitedUserId,
          communityId,
          role: 'MEMBER',
        })),
        skipDuplicates: true,
      });

    return {
      message: `${invitedCount.count} users invited`,
      invitedCount: invitedCount.count,
    };
  }

  @HandleError('Failed to ban member')
  async banMember(communityId: string, dto: BanMemberDto, userId: string) {
    const userMembership =
      await this.prisma.client.communitiesMembership.findUnique({
        where: { userId_communityId: { userId, communityId } },
      });

    if (!userMembership || userMembership.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can ban');
    }

    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId === dto.userId) {
      throw new BadRequestException('Cannot ban community owner');
    }

    await this.prisma.client.communitiesMembership.deleteMany({
      where: { userId: dto.userId, communityId },
    });

    return { message: 'Member banned', banDuration: dto.banDurationDays };
  }

  @HandleError('Failed to verify community')
  async verifyCommunity(
    communityId: string,
    dto: VerifyCommunityDto,
    userId: string,
  ) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId !== userId) {
      throw new ForbiddenException('Only owner can request verification');
    }

    const verified = await this.prisma.client.community.update({
      where: { id: communityId },
      data: { isVerified: true },
    });

    return {
      message: 'Community verified',
      data: { id: verified.id, verified: verified.isVerified },
    };
  }

  @HandleError('Failed to update cap level')
  async updateCapLevel(
    communityId: string,
    dto: UpdateCapLevelDto,
    userId: string,
  ) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId !== userId) {
      throw new ForbiddenException('Only owner can update cap level');
    }

    const updated = await this.prisma.client.community.update({
      where: { id: communityId },
      data: { capLevel: dto.capLevel as any },
    });

    return {
      message: 'Cap level updated',
      data: { id: updated.id, capLevel: updated.capLevel },
    };
  }

  @HandleError('Failed to toggle notifications')
  async toggleNotifications(
    communityId: string,
    dto: ToggleNotificationDto,
    userId: string,
  ) {
    const membership =
      await this.prisma.client.communitiesMembership.findUnique({
        where: { userId_communityId: { userId, communityId } },
      });

    if (!membership) throw new ForbiddenException('Not a community member');

    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
    });

    if (!community || community.ownerId !== userId) {
      throw new ForbiddenException('Only owner can toggle notifications');
    }

    const updated = await this.prisma.client.community.update({
      where: { id: communityId },
      data: { isToggleNotification: dto.isEnabled },
    });

    return {
      message: 'Notifications toggled',
      data: {
        id: updated.id,
        toggleNotifications: updated.isToggleNotification,
      },
    };
  }

  @HandleError('Failed to get community statistics')
  async getCommunityStats(communityId: string) {
    const community = await this.prisma.client.community.findUnique({
      where: { id: communityId },
      include: {
        _count: {
          select: { memberships: true, CommunityFollower: true, posts: true },
        },
      },
    });

    if (!community) throw new NotFoundException('Community not found');

    const posts = await this.prisma.client.post.findMany({
      where: { communityId },
      include: { _count: { select: { comments: true, likes: true } } },
    });

    const totalComments = posts.reduce((sum, p) => sum + p._count.comments, 0);
    const totalLikes = posts.reduce((sum, p) => sum + p._count.likes, 0);

    return {
      communityId,
      totalMembers: community._count.memberships,
      totalFollowers: community._count.CommunityFollower,
      totalPosts: community._count.posts,
      totalComments,
      totalLikes,
      engagementRate:
        community._count.posts > 0
          ? ((totalComments + totalLikes) / community._count.posts).toFixed(2)
          : 0,
    };
  }

  @HandleError('Failed to get trending communities')
  async getTrendingCommunities(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [communities, total] = await Promise.all([
      this.prisma.client.community.findMany({
        skip,
        take: limit,
        orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }],
        include: {
          profile: true,
          _count: { select: { memberships: true, CommunityFollower: true } },
        },
      }),
      this.prisma.client.community.count(),
    ]);

    const trendingCommunities = communities.map((community) => ({
      id: community.id,
      type: community.communityType,
      ownerId: community.ownerId,
      bio: community.profile?.bio,
      profileImage: community.profile?.profileImage,
      verified: community.isVerified,
      capLevel: community.capLevel,
      likes: community.likes,
      memberCount: community._count.memberships,
      followerCount: community._count.CommunityFollower,
      trendingScore: community.likes + community._count.memberships,
      createdAt: community.createdAt,
    }));

    return {
      data: trendingCommunities,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  @HandleError('Failed to search communities')
  async searchCommunities(searchTerm: string, pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      this.prisma.client.community.findMany({
        where: {
          OR: [
            { profile: { bio: { contains: searchTerm, mode: 'insensitive' } } },
            {
              about: { mission: { contains: searchTerm, mode: 'insensitive' } },
            },
          ],
        },
        skip,
        take: limit,
        include: {
          profile: true,
          _count: { select: { memberships: true, CommunityFollower: true } },
        },
      }),
      this.prisma.client.community.count({
        where: {
          OR: [
            { profile: { bio: { contains: searchTerm, mode: 'insensitive' } } },
            {
              about: { mission: { contains: searchTerm, mode: 'insensitive' } },
            },
          ],
        },
      }),
    ]);

    const searchResults = results.map((community) => ({
      id: community.id,
      type: community.communityType,
      ownerId: community.ownerId,
      bio: community.profile?.bio,
      profileImage: community.profile?.profileImage,
      verified: community.isVerified,
      capLevel: community.capLevel,
      likes: community.likes,
      memberCount: community._count.memberships,
      followerCount: community._count.CommunityFollower,
      createdAt: community.createdAt,
    }));

    return {
      data: searchResults,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        searchTerm,
      },
    };
  }
}

import { PrismaService } from '@/lib/prisma/prisma.service';
import { AuthUtilsService } from '@/lib/utils/services/auth-utils.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserRole } from '../../../../prisma/generated/enums';

@Injectable()
export class DefaultUsersService implements OnModuleInit {
  private readonly logger = new Logger(DefaultUsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtilsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultUsers();
  }

  private async seedDefaultUsers(): Promise<void> {
    const users = [
      {
        name: 'Admin One',
        email: 'admin1@gmail.com',
        password: '12345678',
        role: 'ADMIN',
        profilePicture: 'https://i.pravatar.cc/200?img=12',
      },
      {
        name: 'Admin Two',
        email: 'admin2@gmail.com',
        password: '12345678',
        role: 'ADMIN',
        profilePicture: 'https://i.pravatar.cc/200?img=47',
      },
      {
        name: 'Manager',
        email: 'manager@gmail.com',
        password: 'Manager@123',
        role: 'ADMIN',
        profilePicture: 'https://i.pravatar.cc/200?img=33',
      },
      {
        name: 'User One',
        email: 'user1@gmail.com',
        password: '12345678',
        role: 'USER',
        profilePicture: 'https://i.pravatar.cc/200?img=68',
      },
      {
        name: 'User Two',
        email: 'user2@gmail.com',
        password: '12345678',
        role: 'USER',
        profilePicture: 'https://i.pravatar.cc/200?img=45',
      },
      {
        name: 'User Three',
        email: 'user3@gmail.com',
        password: '12345678',
        role: 'USER',
        profilePicture: 'https://i.pravatar.cc/200?img=59',
      },
    ];
    for (const user of users) {
      const exists = await this.prisma.client.user.findFirst({
        where: { email: user.email },
      });

      if (!exists) {
        await this.prisma.client.user.create({
          data: {
            name: user.name,
            email: user.email,
            password: await this.authUtils.hash(user.password),
            role: 'USER',
            profilePicture: user.profilePicture,
            isVerified: true,
            lastLoginAt: new Date(),
            lastActiveAt: new Date(),
          },
        });

        this.logger.log(`[CREATE] User created: ${user.email}`);
      } else {
        await this.prisma.client.user.update({
          where: { email: user.email },
          data: {
            role: user.role as UserRole,
            isVerified: true,
            lastActiveAt: new Date(),
          },
        });

        this.logger.log(`[UPDATE] User updated: ${user.email}`);
      }
    }
  }
}

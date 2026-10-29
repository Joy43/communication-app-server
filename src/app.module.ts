import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { ENVEnum } from './common/enum/env.enum';
import { JwtStrategy } from './core/jwt/jwt.strategy';
import { LoggerMiddleware } from './core/middleware/logger.middleware';
import { LibModule } from './lib/lib.module';
import { MainModule } from './main/main.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    CacheModule.register({
      isGlobal: true,
    }),

    EventEmitterModule.forRoot({
      global: true,
    }),

    ScheduleModule.forRoot(),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/files',
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || process.env.REDIS_URL;

        if (redisUrl) {
          try {
            const parsed = new URL(redisUrl);
            return {
              connection: {
                host: parsed.hostname,
                port: parseInt(parsed.port || '6379', 10),
                username: parsed.username || undefined,
                password: parsed.password || undefined,
                tls: parsed.protocol === 'rediss:' ? {} : undefined,
              },
            };
          } catch {
            // fallback if not a valid URL
          }
        }

        const host =
          configService.get<string>(ENVEnum.REDIS_HOST) ||
          process.env.REDIS_HOST ||
          'localhost';
        const port =
          configService.get<string>(ENVEnum.REDIS_PORT) ||
          process.env.REDIS_PORT ||
          '6379';
        const password =
          configService.get<string>('REDIS_PASSWORD') ||
          process.env.REDIS_PASSWORD;

        return {
          connection: {
            host,
            port: parseInt(port, 10),
            ...(password ? { password } : {}),
          },
        };
      },
    }),

    PassportModule,

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: await config.getOrThrow(ENVEnum.JWT_SECRET),
        signOptions: {
          expiresIn: await config.getOrThrow(ENVEnum.JWT_EXPIRES_IN),
        },
      }),
    }),

    LibModule,

    MainModule,
  ],
  controllers: [AppController],
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

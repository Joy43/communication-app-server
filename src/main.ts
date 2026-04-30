import 'reflect-metadata';

import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { ENVEnum } from './common/enum/env.enum';
import { AllExceptionsFilter } from './core/filter/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  // enable cors
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // global pipes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Backend API')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Stripe webhook raw body
  app.use(
    '/path-to-stripe-webhook',
    bodyParser.raw({ type: 'application/json' }),
  );

const port =
  parseInt(configService.get<string>(ENVEnum.PORT) ?? '', 10) ||
  parseInt(process.env.PORT || '3000', 10);

await app.listen(port, '0.0.0.0');

logger.log(`🚀 Server running on: http://0.0.0.0:${port}`);
logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();
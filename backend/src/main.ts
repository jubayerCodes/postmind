import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  const port = configService.get<number>('PORT', 4000);

  // Allow up to 50MB for high-res base64 images and large product documents
  const express = await import('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const allowedOrigins: (string | RegExp)[] = [
    frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (configService.get<string>('NODE_ENV') !== 'production') {
    allowedOrigins.push(/https?:\/\/.*\.ngrok-free\.app/);
    allowedOrigins.push(/https?:\/\/.*\.ngrok\.io/);
    allowedOrigins.push(/https?:\/\/.*\.trycloudflare\.com/);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-store-id', 'x-dev-user-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
  logger.log(`🚀 PostMind Backend running on http://localhost:${port}`);
}

bootstrap();

/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS (Configure appropriately for production)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001', // Allow requests from your frontend
    credentials: true, // Allow cookies to be sent
  });

  // Use cookie-parser middleware globally
  app.use(cookieParser());

  // Enable global validation pipes for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are provided
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow basic type conversions
      },
    }),
  );

  // Graceful shutdown for Prisma
  app.get(PrismaClient);
  app.enableShutdownHooks(); // Enable NestJS shutdown hooks
  // Removed the deprecated prismaClient.$on('beforeExit', ...)
  // NestJS shutdown hooks handle Prisma disconnection better in recent versions

  // Start listening
  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

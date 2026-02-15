import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Ensure uploads directory exists
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  
  // Serve static files from uploads folder
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });
  const baseUrl = process.env.BASE_URL;
  const port = parseInt(process.env.PORT || '3001', 10);
  app.enableCors({
    origin: `${baseUrl}:3000`,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.setGlobalPrefix('api');
  
  
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on ${baseUrl}:${port}`);
}
bootstrap();

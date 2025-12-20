import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:5173', // Vite's default port
  });
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip unknown properties
    transform: true, // Auto-transform payloads to DTO types
  }));
  
  await app.listen(3000);
  console.log('🚀 Backend running on http://localhost:3000');
}
bootstrap();
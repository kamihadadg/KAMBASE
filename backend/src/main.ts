import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { APP_FILTER } from '@nestjs/core';
import helmet from 'helmet';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { initializeDatabaseBeforeApp } from './config/database-pre-init';
import { ThrottlerExceptionFilter } from './filters/throttler-exception.filter';

async function bootstrap() {
  // Initialize database before creating the app
  await initializeDatabaseBeforeApp();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);


  // Security
  app.use(helmet());
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:8081',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter for ThrottlerException
  app.useGlobalFilters(new ThrottlerExceptionFilter());

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Digital Exchange API')
    .setDescription('API documentation for Exchange Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('kyc', 'KYC operations')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();


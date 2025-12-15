import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import * as path from 'path';
import { I18nModule, AcceptLanguageResolver, HeaderResolver, QueryResolver } from 'nestjs-i18n';
import { existsSync } from 'fs';
import { TypeOrmConfigService } from './config/typeorm.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { KycModule } from './modules/kyc/kyc.module';
import { EmailModule } from './modules/email/email.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Internationalization
    I18nModule.forRoot({
      fallbackLanguage: 'fa',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n/'),
        watch: true,
      },
      resolvers: [
        AcceptLanguageResolver,
        new HeaderResolver(['accept-language']),
        new QueryResolver(['lang']),
      ],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),

    // Rate limiting for different endpoints
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 900000, // 15 minutes
        limit: 3, // 3 requests per 15 minutes (for forgot-password and resend-verification)
      },
      {
        name: 'register',
        ttl: 900000, // 15 minutes
        limit: 5, // 5 registrations per 15 minutes
      },
      {
        name: 'login',
        ttl: 900000, // 15 minutes
        limit: 10, // 10 login attempts per 15 minutes
      },
      {
        name: 'reset-password',
        ttl: 900000, // 15 minutes
        limit: 5, // 5 reset attempts per 15 minutes
      },
      {
        name: '2fa-verify',
        ttl: 300000, // 5 minutes
        limit: 5, // 5 2FA attempts per 5 minutes
      },
      {
        name: 'refresh-token',
        ttl: 3600000, // 1 hour
        limit: 20, // 20 refresh attempts per hour
      },
    ]),

        // Feature modules
        EmailModule,
        AuthModule,
        UsersModule,
        KycModule,
        FileUploadModule,
  ],
})
export class AppModule {}


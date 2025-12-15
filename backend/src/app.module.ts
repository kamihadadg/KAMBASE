import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
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

    // Database
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),

    // Rate limiting (only for specific endpoints via @Throttle decorator)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 900000, // 15 minutes
        limit: 3, // 3 requests per 15 minutes (for forgot-password and resend-verification)
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


import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseInitService } from './database-init.service';

@Module({
  imports: [ConfigModule, TypeOrmModule],
  providers: [
    DatabaseInitService,
    {
      provide: 'DATA_SOURCE',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [getDataSourceToken()],
    },
  ],
})
export class DatabaseInitModule implements OnModuleInit {
  constructor(
    private databaseInitService: DatabaseInitService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Auto-create database and schema
    const autoCreate = this.configService.get('DB_AUTO_CREATE', 'true') === 'true';
    
    if (autoCreate) {
      try {
        // Wait a bit for TypeORM to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.databaseInitService.initializeDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Don't throw - let the app continue, TypeORM will handle connection
      }
    }
  }
}


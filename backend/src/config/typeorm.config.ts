import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_DATABASE', 'kamcex'),
      schema: this.configService.get('DB_SCHEMA', 'exchange'),
      // Use autoLoadEntities instead of manual path
      autoLoadEntities: true,
      // Migrations are optional
      migrations: [],
      synchronize: 
        this.configService.get('DB_SYNC', 'false') === 'true' ||
        this.configService.get('NODE_ENV') === 'local' ||
        this.configService.get('NODE_ENV') === 'development',
      logging: 
        this.configService.get('NODE_ENV') === 'local' ||
        this.configService.get('NODE_ENV') === 'development',
    };
  }
}

// For migrations
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'kamcex',
  schema: process.env.DB_SCHEMA || 'exchange',
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
};

export default new DataSource(dataSourceOptions);


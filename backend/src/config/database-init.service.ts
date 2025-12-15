import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseInitService {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @Optional() @Inject('DATA_SOURCE') private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async initializeDatabase(): Promise<void> {
    try {
      // Check if database exists
      const dbName = this.configService.get('DB_DATABASE', 'kamcex');
      const schema = this.configService.get('DB_SCHEMA', 'exchange');

      // Create database if not exists
      const adminDataSource = new DataSource({
        type: 'postgres',
        host: this.configService.get('DB_HOST', 'localhost'),
        port: this.configService.get('DB_PORT', 5432),
        username: this.configService.get('DB_USERNAME', 'postgres'),
        password: this.configService.get('DB_PASSWORD', 'postgres'),
        database: 'postgres', // Connect to default database
      });

      await adminDataSource.initialize();

      // Check if database exists
      const dbExists = await adminDataSource.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName],
      );

      if (dbExists.length === 0) {
        this.logger.log(`Creating database: ${dbName}`);
        await adminDataSource.query(`CREATE DATABASE ${dbName}`);
        this.logger.log(`Database ${dbName} created successfully`);
      }

      await adminDataSource.destroy();

      // Wait for TypeORM to initialize the main data source
      // We'll create schema using a new connection
      const mainDataSource = new DataSource({
        type: 'postgres',
        host: this.configService.get('DB_HOST', 'localhost'),
        port: this.configService.get('DB_PORT', 5432),
        username: this.configService.get('DB_USERNAME', 'postgres'),
        password: this.configService.get('DB_PASSWORD', 'postgres'),
        database: dbName,
      });

      await mainDataSource.initialize();

      // Create schema if not exists
      const schemaExists = await mainDataSource.query(
        `SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`,
        [schema],
      );

      if (schemaExists.length === 0) {
        this.logger.log(`Creating schema: ${schema}`);
        await mainDataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
        this.logger.log(`Schema ${schema} created successfully`);
      }

      await mainDataSource.destroy();

      this.logger.log('Database and schema initialization completed');
      this.logger.log('TypeORM will handle table creation via synchronize option');
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }
}


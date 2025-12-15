import { DataSource } from 'typeorm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadEnvFile(): void {
  const envFiles = ['.env.local', '.env'];
  
  for (const file of envFiles) {
    const filePath = join(process.cwd(), file);
    if (!existsSync(filePath)) {
      continue;
    }
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const equalIndex = trimmed.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            let value = trimmed.substring(equalIndex + 1).trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            if (key && !process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      }
    } catch (e) {
      // Ignore file read errors
    }
  }
}

export async function initializeDatabaseBeforeApp(): Promise<void> {
  // Load .env file manually since we're running before NestJS
  loadEnvFile();
  const dbName = process.env.DB_DATABASE || 'kambase';
  const schema = process.env.DB_SCHEMA || 'public';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432');
  const username = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const autoCreate = process.env.DB_AUTO_CREATE !== 'false';

  if (!autoCreate) {
    console.log('DB_AUTO_CREATE is disabled, skipping database initialization');
    return;
  }

  try {
    console.log('[Database Init] Initializing database...');

    // Connect to default postgres database to create our database
    const adminDataSource = new DataSource({
      type: 'postgres',
      host,
      port,
      username,
      password,
      database: 'postgres',
    });

    await adminDataSource.initialize();
    console.log('[Database Init] Connected to PostgreSQL');

    // Check if database exists
    const dbExists = await adminDataSource.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );

    if (dbExists.length === 0) {
      console.log(`[Database Init] Creating database: ${dbName}`);
      await adminDataSource.query(`CREATE DATABASE ${dbName}`);
      console.log(`[Database Init] Database ${dbName} created successfully`);
    } else {
      console.log(`[Database Init] Database ${dbName} already exists`);
    }

    await adminDataSource.destroy();

    // Now connect to our database to create schema
    const mainDataSource = new DataSource({
      type: 'postgres',
      host,
      port,
      username,
      password,
      database: dbName,
    });

    await mainDataSource.initialize();
    console.log(`[Database Init] Connected to database: ${dbName}`);

    // Create schema if not exists
    const schemaExists = await mainDataSource.query(
      `SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`,
      [schema],
    );

    if (schemaExists.length === 0) {
      console.log(`[Database Init] Creating schema: ${schema}`);
      await mainDataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      console.log(`[Database Init] Schema ${schema} created successfully`);
    } else {
      console.log(`[Database Init] Schema ${schema} already exists`);
    }

    await mainDataSource.destroy();

    console.log('[Database Init] Database initialization completed');
  } catch (error: any) {
    console.error('[Database Init] Database initialization failed:', error?.message || error);
    // Don't throw - let TypeORM handle the connection
    // It will show a proper error if database doesn't exist
  }
}


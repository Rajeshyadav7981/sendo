import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

loadEnv();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '54322', 10),
  username: process.env.DB_USERNAME ?? 'demo',
  password: process.env.DB_PASSWORD ?? 'demo',
  database: process.env.DB_DATABASE ?? 'demo',
  schema: process.env.DB_SCHEMA ?? 'sendo',
  entities: [__dirname + '/../**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  migrationsRun: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);

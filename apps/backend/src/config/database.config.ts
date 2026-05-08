import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '54322', 10),
  username: process.env.DB_USERNAME ?? 'demo',
  password: process.env.DB_PASSWORD ?? 'demo',
  database: process.env.DB_DATABASE ?? 'demo',
  schema: process.env.DB_SCHEMA ?? 'sendo',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true',

  // Connection pool. Each Node process gets its own pool, so size for the
  // expected concurrency of *one* instance, not the whole fleet.
  poolMax: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
  poolIdleTimeoutMs: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? '30000', 10),
  // Hard cap on any single statement; safety net against runaway queries
  // pinning a connection forever. 30s is generous for OLTP.
  statementTimeoutMs: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS ?? '30000', 10),
  // pino-style threshold — log queries slower than this so we can spot
  // missing indexes in prod.
  slowQueryMs: parseInt(process.env.DB_SLOW_QUERY_MS ?? '500', 10),
}));

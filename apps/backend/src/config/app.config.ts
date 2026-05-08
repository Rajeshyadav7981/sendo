import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  name: process.env.APP_NAME ?? 'sendo-backend',
  port: parseInt(process.env.PORT ?? '5001', 10),
  baseUrl: process.env.BASE_URL ?? 'http://localhost:5001',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  uploadsDir: process.env.UPLOADS_DIR ?? './uploads',
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES ?? '10485760', 10),
  throttle: {
    ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },
}));

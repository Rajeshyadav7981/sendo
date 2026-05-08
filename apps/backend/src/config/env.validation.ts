import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  PORT = 5001;

  @IsString()
  APP_NAME = 'sendo-backend';

  @IsString()
  LOG_LEVEL = 'info';

  // ── Postgres / TypeORM ────────────────────────────────────────────────────
  @IsString() DB_HOST = 'localhost';
  @IsInt() DB_PORT = 54322;
  @IsString() DB_USERNAME = 'demo';
  @IsString() DB_PASSWORD = 'demo';
  @IsString() DB_DATABASE = 'demo';
  @IsOptional() @IsBooleanString() DB_SYNCHRONIZE?: string;
  @IsOptional() @IsBooleanString() DB_LOGGING?: string;
  @IsOptional() @IsBooleanString() DB_SSL?: string;

  // ── Redis ─────────────────────────────────────────────────────────────────
  @IsString() REDIS_HOST = 'localhost';
  @IsInt() REDIS_PORT = 6379;
  @IsOptional() @IsString() REDIS_PASSWORD?: string;
  @IsInt() @Min(0) REDIS_DB = 0;

  // ── JWT ───────────────────────────────────────────────────────────────────
  @IsString() JWT_SECRET!: string;
  @IsString() JWT_EXPIRES_IN = '7d';
  @IsOptional() @IsString() JWT_REFRESH_SECRET?: string;
  @IsString() JWT_REFRESH_EXPIRES_IN = '30d';
  @IsString() COOKIE_SECRET!: string;

  // ── CORS ──────────────────────────────────────────────────────────────────
  @IsOptional() @IsString() CORS_ORIGINS?: string;

  // ── OTP ───────────────────────────────────────────────────────────────────
  @IsInt() @Min(30) OTP_TTL_SECONDS = 300;
  @IsInt() @Min(1) OTP_MAX_ATTEMPTS = 5;

  // ── Email ─────────────────────────────────────────────────────────────────
  @IsOptional() @IsString() EMAIL_HOST?: string;
  @IsOptional() @IsInt() EMAIL_PORT?: number;
  @IsOptional() @IsBooleanString() EMAIL_SECURE?: string;
  @IsOptional() @IsString() EMAIL_USER?: string;
  @IsOptional() @IsString() EMAIL_PASS?: string;
  @IsOptional() @IsString() EMAIL_FROM?: string;

  // ── Twilio ────────────────────────────────────────────────────────────────
  @IsOptional() @IsString() TWILIO_SID?: string;
  @IsOptional() @IsString() TWILIO_AUTH_TOKEN?: string;
  @IsOptional() @IsString() TWILIO_PHONE?: string;
  @IsString() TWILIO_DEFAULT_COUNTRY_CODE = '+91';

  // ── Files ─────────────────────────────────────────────────────────────────
  @IsString() UPLOADS_DIR = './uploads';
  @IsInt() @Min(1) MAX_FILE_SIZE_BYTES = 10_485_760;
  @IsString() BASE_URL = 'http://localhost:5001';

  // ── Throttler ─────────────────────────────────────────────────────────────
  @IsInt() @Min(1) THROTTLE_TTL_MS = 60_000;
  @IsInt() @Min(1) THROTTLE_LIMIT = 120;
}

const NUMERIC_KEYS = [
  'PORT',
  'DB_PORT',
  'REDIS_PORT',
  'REDIS_DB',
  'OTP_TTL_SECONDS',
  'OTP_MAX_ATTEMPTS',
  'EMAIL_PORT',
  'MAX_FILE_SIZE_BYTES',
  'THROTTLE_TTL_MS',
  'THROTTLE_LIMIT',
];

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const coerced: Record<string, unknown> = { ...config };
  for (const key of NUMERIC_KEYS) {
    const v = coerced[key];
    if (typeof v === 'string' && v !== '') {
      const n = Number(v);
      if (!Number.isNaN(n)) coerced[key] = n;
    }
  }
  const validated = plainToInstance(EnvironmentVariables, coerced, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors.map((e) => e.toString()).join('\n')}`,
    );
  }
  return validated;
}

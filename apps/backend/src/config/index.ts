import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import mailConfig from './mail.config';
import twilioConfig from './twilio.config';
import otpConfig from './otp.config';
import storageConfig from './storage.config';

export const configurations = [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  mailConfig,
  twilioConfig,
  otpConfig,
  storageConfig,
];

export { validateEnv } from './env.validation';

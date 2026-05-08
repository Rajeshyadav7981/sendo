import { registerAs } from '@nestjs/config';

export default registerAs('otp', () => ({
  ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '300', 10),
  maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
}));

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? '',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? '',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  cookieSecret: process.env.COOKIE_SECRET ?? '',
}));

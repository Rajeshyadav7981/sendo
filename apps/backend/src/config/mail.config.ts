import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER ?? '',
  pass: process.env.EMAIL_PASS ?? '',
  from: process.env.EMAIL_FROM ?? 'Sendo <noreply@sendo.local>',
}));

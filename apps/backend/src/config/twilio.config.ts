import { registerAs } from '@nestjs/config';

export default registerAs('twilio', () => ({
  sid: process.env.TWILIO_SID ?? '',
  authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  phone: process.env.TWILIO_PHONE ?? '',
  defaultCountryCode: process.env.TWILIO_DEFAULT_COUNTRY_CODE ?? '+91',
}));

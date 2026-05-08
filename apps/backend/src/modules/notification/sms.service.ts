import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import twilio, { Twilio } from 'twilio';
import twilioConfig from '../../config/twilio.config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: Twilio | null;

  constructor(@Inject(twilioConfig.KEY) private readonly cfg: ConfigType<typeof twilioConfig>) {
    this.client = cfg.sid && cfg.authToken ? twilio(cfg.sid, cfg.authToken) : null;
  }

  /** True when Twilio creds are wired up. Lets callers (OtpService) skip the
   *  send and fall back to a dev log without us having to throw. */
  get isConfigured(): boolean {
    return this.client !== null;
  }

  /** Format an Indian-style phone number to E.164 if missing the `+`. */
  formatPhone(phone: string): string {
    const trimmed = (phone ?? '').trim();
    if (!trimmed) throw new Error('Phone number is required');
    return trimmed.startsWith('+') ? trimmed : `${this.cfg.defaultCountryCode}${trimmed}`;
  }

  async send(to: string, body: string): Promise<void> {
    if (!this.client) {
      throw new ServiceUnavailableException('SMS provider is not configured');
    }
    try {
      await this.client.messages.create({
        body,
        from: this.cfg.phone,
        to,
      });
    } catch (err) {
      this.logger.error(`SMS send failed to ${to}`, err as Error);
      throw err;
    }
  }
}

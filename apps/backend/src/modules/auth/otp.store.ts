import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import otpConfig from '../../config/otp.config';
import { RedisService } from '../../common/redis/redis.service';

interface StoredOtp {
  otp: string;
  attempts: number;
}

/**
 * Redis-backed OTP store. Replaces the legacy in-memory `otpStore = {}` from
 * `Routers/AuthRouter.js`, which lost OTPs on restart and didn't survive
 * multi-instance deployments.
 */
@Injectable()
export class OtpStore {
  constructor(
    private readonly redis: RedisService,
    @Inject(otpConfig.KEY) private readonly cfg: ConfigType<typeof otpConfig>,
  ) {}

  private key(scope: string, id: string): string {
    return `otp:${scope}:${id.toLowerCase()}`;
  }

  generate(): string {
    return String(randomInt(100_000, 1_000_000));
  }

  async issue(scope: string, id: string, otp = this.generate()): Promise<string> {
    const payload: StoredOtp = { otp, attempts: 0 };
    await this.redis.set(this.key(scope, id), JSON.stringify(payload), 'EX', this.cfg.ttlSeconds);
    return otp;
  }

  async verify(scope: string, id: string, candidate: string): Promise<boolean> {
    const k = this.key(scope, id);
    const raw = await this.redis.get(k);
    if (!raw) return false;

    const stored = JSON.parse(raw) as StoredOtp;
    stored.attempts += 1;

    if (stored.attempts >= this.cfg.maxAttempts) {
      await this.redis.del(k);
      return false;
    }

    if (stored.otp !== candidate) {
      await this.redis.set(k, JSON.stringify(stored), 'KEEPTTL');
      return false;
    }

    await this.redis.del(k);
    return true;
  }

  async invalidate(scope: string, id: string): Promise<void> {
    await this.redis.del(this.key(scope, id));
  }
}

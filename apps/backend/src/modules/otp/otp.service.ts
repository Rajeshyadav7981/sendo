import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import otpConfig from '../../config/otp.config';
import { OtpUser } from '../auth/entities/otp-user.entity';
import { UserRole } from '../auth/entities/user.entity';
import type { JwtPayload } from '../auth/interfaces/auth-user.interface';
import { Driver } from '../driver/entities/driver.entity';
import { SmsService } from '../notification/sms.service';

export interface VerifyOtpResult {
  success: true;
  message: string;
  token: string;
  driverId: string | null;
  driverDetails: Driver | null;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(OtpUser) private readonly otpUsers: Repository<OtpUser>,
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
    private readonly sms: SmsService,
    private readonly jwt: JwtService,
    @Inject(otpConfig.KEY) private readonly cfg: ConfigType<typeof otpConfig>,
  ) {}

  async sendOtp(phone: string): Promise<{ success: true; message: string }> {
    const formatted = this.sms.formatPhone(phone);

    const otp = String(randomInt(1_000, 10_000));
    const otpExpires = new Date(Date.now() + this.cfg.ttlSeconds * 1_000);

    // Persist FIRST so the OTP exists even if SMS delivery fails. Without
    // this, a Twilio outage would 500 the request and leave nothing in the
    // table for the user to verify against.
    const existing = await this.otpUsers.findOne({ where: { phone: formatted } });
    if (existing) {
      existing.otp = otp;
      existing.otpExpires = otpExpires;
      await this.otpUsers.save(existing);
    } else {
      await this.otpUsers.save(this.otpUsers.create({ phone: formatted, otp, otpExpires }));
    }

    if (this.sms.isConfigured) {
      await this.sms.send(formatted, `Your OTP is: ${otp}`);
      return { success: true, message: 'OTP Sent!' };
    }

    // Dev fallback: Twilio not wired up. Use console.warn so the OTP lands
    // in stdout regardless of pino's level filter. The OTP is never returned
    // in the response — the caller reads it from the backend console.
    // eslint-disable-next-line no-console
    console.warn(`[OTP] ${formatted} -> ${otp}  (Twilio not configured; dev mode)`);
    this.logger.warn(`[dev] SMS provider not configured. OTP for ${formatted} is ${otp}`);
    return { success: true, message: 'OTP generated (dev mode — see backend logs).' };
  }

  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
    const formatted = this.sms.formatPhone(phone);
    const user = await this.otpUsers.findOne({ where: { phone: formatted } });
    if (!user || !user.otp || !user.otpExpires) {
      throw new BadRequestException('User not found');
    }
    if (user.otpExpires.getTime() < Date.now() || user.otp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    user.otp = null;
    user.otpExpires = null;
    await this.otpUsers.save(user);

    const localPhone = formatted.startsWith('+91') ? formatted.slice(3) : formatted;
    const driver = await this.drivers.findOne({ where: { contactNumber: localPhone } });

    const payload: JwtPayload = driver
      ? {
          sub: driver.driverId,
          email: '',
          role: UserRole.DRIVER,
          driverId: driver.driverId,
          phone: localPhone,
        }
      : {
          sub: `phone:${localPhone}`,
          email: '',
          role: UserRole.DRIVER,
          phone: localPhone,
        };
    const token = this.jwt.sign(payload);

    return {
      success: true,
      message: 'OTP Verified! Login Successful',
      token,
      driverId: driver?.driverId ?? null,
      driverDetails: driver ?? null,
    };
  }
}

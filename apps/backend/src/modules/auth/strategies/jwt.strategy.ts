import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import type { FastifyRequest } from 'fastify';
import jwtConfig from '../../../config/jwt.config';
import { Driver } from '../../driver/entities/driver.entity';
import { User, UserRole } from '../entities/user.entity';
import type { AuthUser, JwtPayload } from '../interfaces/auth-user.interface';

const cookieExtractor = (req: FastifyRequest): string | null => {
  const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies;
  return cookies?.token ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY) cfg: ConfigType<typeof jwtConfig>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: cfg.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.role === UserRole.DRIVER) {
      const driverId = payload.driverId ?? payload.sub;
      const driver = await this.drivers.findOne({ where: { driverId } });
      if (!driver || !driver.isActive || driver.deletedAt) {
        throw new UnauthorizedException('Driver not found or disabled');
      }
      return {
        id: driver.id,
        email: payload.email ?? '',
        fullName:
          [driver.firstName, driver.surname].filter(Boolean).join(' ') || driver.driverId,
        role: UserRole.DRIVER,
        driverId: driver.driverId,
        phone: driver.contactNumber ?? payload.phone ?? undefined,
      };
    }

    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or disabled');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}

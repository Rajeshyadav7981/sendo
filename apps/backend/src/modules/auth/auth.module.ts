import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from '../../config/app.config';
import jwtConfig from '../../config/jwt.config';
import otpConfig from '../../config/otp.config';
import { Driver } from '../driver/entities/driver.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpStore } from './otp.store';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Driver]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(otpConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: (cfg: ConfigType<typeof jwtConfig>): JwtModuleOptions => ({
        secret: cfg.secret,
        signOptions: { expiresIn: cfg.expiresIn as unknown as number },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OtpStore],
  exports: [AuthService, JwtModule, OtpStore, TypeOrmModule],
})
export class AuthModule {}

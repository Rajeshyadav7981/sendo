import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import otpConfig from '../../config/otp.config';
import { AuthModule } from '../auth/auth.module';
import { OtpUser } from '../auth/entities/otp-user.entity';
import { Driver } from '../driver/entities/driver.entity';
import { NotificationModule } from '../notification/notification.module';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [
    ConfigModule.forFeature(otpConfig),
    TypeOrmModule.forFeature([OtpUser, Driver]),
    NotificationModule,
    AuthModule,
  ],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import mailConfig from '../../config/mail.config';
import twilioConfig from '../../config/twilio.config';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';
import { MailService } from './mail.service';
import { NotificationController } from './notification.controller';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
    ConfigModule.forFeature(twilioConfig),
    TypeOrmModule.forFeature([Notification, DeviceToken]),
  ],
  controllers: [NotificationController],
  providers: [MailService, SmsService, NotificationsService],
  exports: [MailService, SmsService, NotificationsService, TypeOrmModule],
})
export class NotificationModule {}

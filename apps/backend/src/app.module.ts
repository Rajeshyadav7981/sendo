import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { configurations, validateEnv } from './config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { DatabaseModule } from './database/database.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { BillingModule } from './modules/billing/billing.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DriverModule } from './modules/driver/driver.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationModule } from './modules/notification/notification.module';
import { OtpModule } from './modules/otp/otp.module';
import { TrackerModule } from './modules/tracker/tracker.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { TripModule } from './modules/trip/trip.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { VendorModule } from './modules/vendor/vendor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      validate: validateEnv,
      cache: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', '*.password'],
          censor: '[REDACTED]',
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    StorageModule,
    AuditModule,
    NotificationModule,
    AuthModule,
    OtpModule,
    DriverModule,
    VehicleModule,
    VendorModule,
    TripModule,
    AttendanceModule,
    BillingModule,
    CustomerModule,
    TrackingModule,
    TrackerModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

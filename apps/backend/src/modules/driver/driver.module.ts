import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from '../../config/app.config';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { Driver } from './entities/driver.entity';
import { DriverAssignment } from './entities/driver-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, DriverAssignment, Vehicle]),
    ConfigModule.forFeature(appConfig),
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService, TypeOrmModule],
})
export class DriverModule {}

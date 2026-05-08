import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import jwtConfig from '../../config/jwt.config';
import { Driver } from '../driver/entities/driver.entity';
import { GpsPing } from './entities/gps-ping.entity';
import { VehicleHistory } from './entities/vehicle-history.entity';
import { VehicleLocation } from './entities/vehicle-location.entity';
import { VehicleParking } from './entities/vehicle-parking.entity';
import { TrackingController } from './tracking.controller';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleLocation, VehicleHistory, VehicleParking, GpsPing, Driver]),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: (cfg: ConfigType<typeof jwtConfig>) => ({ secret: cfg.secret }),
    }),
  ],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService, TrackingGateway, TypeOrmModule],
})
export class TrackingModule {}

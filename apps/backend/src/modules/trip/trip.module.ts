import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { Trip } from './entities/trip.entity';
import { TripSheet } from './entities/trip-sheet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripSheet])],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService, TypeOrmModule],
})
export class TripModule {}

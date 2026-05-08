import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingModule } from '../tracking/tracking.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { EmpPasswordGuard } from './guards/emp-password.guard';
import { EmployeeRecord } from './entities/employee-record.entity';
import { Escalation } from './entities/escalation.entity';
import { Fill } from './entities/fill.entity';
import { OdometerEntry } from './entities/odometer-entry.entity';
import { Schedule } from './entities/schedule.entity';
import { TrackerController } from './tracker.controller';
import { TrackerService } from './tracker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeRecord, Schedule, Escalation, Fill, OdometerEntry]),
    VehicleModule,
    TrackingModule,
  ],
  controllers: [TrackerController],
  providers: [TrackerService, EmpPasswordGuard],
})
export class TrackerModule {}

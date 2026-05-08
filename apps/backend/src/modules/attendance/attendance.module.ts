import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController, AttendanceLegacyController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
import { Timesheet } from './entities/timesheet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Timesheet])],
  controllers: [AttendanceController, AttendanceLegacyController],
  providers: [AttendanceService],
  exports: [AttendanceService, TypeOrmModule],
})
export class AttendanceModule {}

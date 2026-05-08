import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsString() driverId!: string;
  @IsString() driverName!: string;
  @IsString() vehicleNumber!: string;
  @IsString() startTime!: string;
  @IsString() stopTime!: string;
  @IsString() duration!: string;

  @IsOptional() @IsString() driverShiftLabel?: string;
  @IsOptional() @IsString() shiftDetail?: string;
}

export class UpdateAttendanceStatusDto {
  @IsIn(['Approved', 'Rejected'])
  status!: 'Approved' | 'Rejected';
}

export class UpdateAttendanceFieldsDto {
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() stopTime?: string;
  @IsOptional() @IsString() duration?: string;
}

export class CreateTimesheetDto {
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() endTime?: string;
  @IsOptional() @Type(() => Number) @IsNumber() totalHours?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalMinutes?: number;
}

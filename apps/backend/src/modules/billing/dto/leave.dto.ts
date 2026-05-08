import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateLeaveDto {
  @IsString() driverId!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsOptional() @IsString() reason?: string;
}

export class UpdateLeaveDto {
  @IsIn(['Approved', 'Rejected']) status!: 'Approved' | 'Rejected';
  @IsOptional() @IsString() leaveType?: string;
}

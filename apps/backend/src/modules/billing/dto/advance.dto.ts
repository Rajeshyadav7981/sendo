import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RequestAdvanceDto {
  @IsString() driverId!: string;
  @IsString() driverName!: string;
  @IsString() month!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  requestedAmount!: number;
}

export class ManualAdvanceDto extends RequestAdvanceDto {
  @Type(() => Number) @IsNumber() approvedAmount!: number;
  @IsString() status!: string;
  @IsString() adminName!: string;
}

export class ApproveAdvanceDto {
  @IsString() advanceId!: string;
  @IsIn(['Approved', 'Rejected', 'Pending']) status!: 'Approved' | 'Rejected' | 'Pending';
  @IsOptional() @Type(() => Number) @IsNumber() approvedAmount?: number;
  @IsOptional() @IsString() adminName?: string;
}

import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDeductionDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() driverId?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() driverMobile?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() lossType?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @IsString() recoveryStatus?: string;
  @IsOptional() @IsString() remarks?: string;
}

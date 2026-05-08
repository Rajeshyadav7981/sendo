import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDieselDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() vehicleRoute?: string;
  @IsOptional() @IsString() pumpName?: string;
  @IsOptional() @IsString() fuelType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() volume?: number;
  @IsOptional() @Type(() => Number) @IsNumber() ratePerLiter?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() startKm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() endKm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalKm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() mileage?: number;
  @IsOptional() @IsString() paymentMode?: string;
  @IsOptional() @IsString() paymentType?: string;
  @IsOptional() @IsString() paidBy?: string;
  @IsOptional() @IsString() paymentReference?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsString() dieselSlipPhoto?: string;
}

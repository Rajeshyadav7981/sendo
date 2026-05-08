import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOilServiceDto {
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsDateString() serviceDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber() odometerReading?: number;
  @IsOptional() @IsDateString() lastServiceDate?: string;
  @IsOptional() @IsString() oilType?: string;
  @IsOptional() @IsString() oilBrand?: string;
  @IsOptional() @Type(() => Number) @IsNumber() oilQuantity?: number;
  @IsOptional() @IsString() oilGrade?: string;
  @IsOptional() @IsString() serviceCenterName?: string;
  @IsOptional() @IsString() serviceCenter?: string;
  @IsOptional() @IsString() technicianName?: string;
  @IsOptional() @IsString() contactNumber?: string;
}

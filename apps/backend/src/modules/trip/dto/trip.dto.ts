import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class StartTripDto {
  @IsString()
  driverId!: string;

  @IsString()
  vehicleNumber!: string;
}

export class StopTripDto {
  @IsString()
  driverId!: string;
}

export class CreateTripSheetDto {
  @IsOptional() @IsString() tripNumber?: string;
  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() driverId?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() origin?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsDateString() loadingDate?: string;
  @IsOptional() @IsDateString() unloadingDate?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @Type(() => Number) @IsNumber() weight?: number;
  @IsOptional() @Type(() => Number) @IsNumber() freight?: number;
  @IsOptional() @Type(() => Number) @IsNumber() advancePaid?: number;
  @IsOptional() @Type(() => Number) @IsNumber() balanceFreight?: number;
  @IsOptional() @IsString() status?: string;
}

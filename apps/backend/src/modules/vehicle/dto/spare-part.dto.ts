import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSparePartDto {
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() sparePartName?: string;
  @IsOptional() @IsString() partNumber?: string;
  @IsOptional() @IsDateString() replacementDate?: string;
  @IsOptional() @IsIn(['Engine', 'Brake', 'Suspension', 'Electrical']) partCategory?: string;
  @IsOptional() @Type(() => Number) @IsNumber() quantity?: number;
  @IsOptional() @Type(() => Number) @IsNumber() costPerPart?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalCost?: number;
  @IsOptional() @IsString() serviceCenterName?: string;
  @IsOptional() @IsString() technicianName?: string;
  @IsOptional() @IsString() contactNumber?: string;
}

import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTyreReplacementDto {
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsString() modelName?: string;
  @IsOptional() @IsString() manufacturer?: string;
  @IsOptional() @IsString() tyreNumber?: string;
  @IsOptional() @Type(() => Number) @IsNumber() presentKM?: number;
  @IsOptional() @Type(() => Number) @IsNumber() expectedKM?: number;
  @IsOptional() @IsString() tyreBrand?: string;
  @IsOptional() @IsString() tyreSize?: string;
  @IsOptional() @IsDateString() replacementDate?: string;
  @IsOptional() @IsString() tyrePosition?: string;
  @IsOptional() @Type(() => Number) @IsNumber() quantity?: number;
  @IsOptional() @Type(() => Number) @IsNumber() costPerTyre?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalCost?: number;
  @IsOptional() @IsString() warranty?: string;
  @IsOptional() @IsDateString() warrantyExpiry?: string;
  @IsOptional() @IsString() serviceCenterName?: string;
  @IsOptional() @IsString() serviceCenterAddress?: string;
  @IsOptional() @IsString() serviceCenterContact?: string;
  @IsOptional() @IsString() technicianName?: string;
  @IsOptional() @IsString() contactNumber?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsOptional() @Type(() => Number) @IsNumber() totalAmount?: number;
  @IsOptional() @IsString() paymentStatus?: string;
  @IsOptional() @IsString() additionalNotes?: string;
}

import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVendorAdvanceDto {
  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() advanceType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() paymentMode?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() status?: string;
}

export class CreateVendorDeductionDto {
  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() deductionType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() tripNumber?: string;
}

export class CreateVendorPaymentDto {
  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsOptional() @IsString() tripNumber?: string;
  @IsOptional() @Type(() => Number) @IsNumber() grossAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() deductions?: number;
  @IsOptional() @Type(() => Number) @IsNumber() netAmount?: number;
  @IsOptional() @IsDateString() paymentDate?: string;
  @IsOptional() @IsString() paymentMode?: string;
  @IsOptional() @IsString() utrNumber?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsString() status?: string;
}

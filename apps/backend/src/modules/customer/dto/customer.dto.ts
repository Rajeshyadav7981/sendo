import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9 ]+$/)
  companyName!: string;

  @IsString()
  address!: string;

  @IsString()
  @Matches(/^[a-zA-Z ]+$/)
  pointOfContact!: string;

  @IsString()
  @Matches(/^[a-zA-Z ]+$/)
  state!: string;

  @IsString()
  @Matches(/^[0-9]{10}$/)
  phoneNumber!: string;

  @IsEmail()
  emailId!: string;

  @IsString()
  gstNumber!: string;

  @IsString()
  rateCard!: string;
}

export class CreateInvoiceDto {
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() tripFrom?: string;
  @IsOptional() @IsString() tripTo?: string;
  @IsOptional() @IsDateString() invoiceDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() gstAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalAmount?: number;
  @IsOptional() @IsString() status?: string;
}

export class CreatePaymentDto {
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsOptional() @Type(() => Number) @IsNumber() invoiceAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() amountReceived?: number;
  @IsOptional() @Type(() => Number) @IsNumber() balanceDue?: number;
  @IsOptional() @IsDateString() paymentDate?: string;
  @IsOptional() @IsString() paymentMode?: string;
  @IsOptional() @IsString() utrNumber?: string;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsString() status?: string;
}

export class CreateAgreementDto {
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() agreementType?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber() ratePerKm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() fixedRate?: number;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @IsString() terms?: string;
  @IsOptional() @IsString() status?: string;
}

export class CreateGstEntryDto {
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsOptional() @IsDateString() invoiceDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber() taxableAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() cgst?: number;
  @IsOptional() @Type(() => Number) @IsNumber() sgst?: number;
  @IsOptional() @Type(() => Number) @IsNumber() igst?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalGST?: number;
  @IsOptional() @Type(() => Number) @IsNumber() totalAmount?: number;
  @IsOptional() @IsString() filingPeriod?: string;
  @IsOptional() @IsString() filingStatus?: string;
}

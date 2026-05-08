import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsIn(['Vehicle Expense', 'Others']) expenseType?: 'Vehicle Expense' | 'Others';
  @IsOptional() @IsString() vehicleNumber?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() vendor?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @IsString() requestedBy?: string;
  @IsOptional() @IsString() paidBy?: string;
  @IsOptional() @IsIn(['Cash', 'Card', 'Cheque', 'UPI', 'Bank Transfer']) paymentMethod?: string;
  @IsOptional() @IsString() paymentReference?: string;
}

export class CreateOtherExpenseDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @IsString() paidBy?: string;
  @IsOptional() @IsString() paymentMode?: string;
  @IsOptional() @IsString() approvedBy?: string;
  @IsOptional() @IsString() remarks?: string;
}

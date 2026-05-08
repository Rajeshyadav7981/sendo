import {
  IsBooleanString,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @MaxLength(20)
  driverId!: string;

  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() secondName?: string;
  @IsOptional() @IsString() surname?: string;
  @IsOptional() @IsString() fatherName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsDateString() dob?: string;

  @IsOptional() @IsString() dlNumber?: string;
  @IsOptional() @IsDateString() dlValidTill?: string;
  @IsOptional() @IsDateString() dLValidTill?: string;
  @IsOptional() @IsString() DLType?: string;
  @IsOptional() @IsString() dlType?: string;

  @IsOptional() @IsDateString() joiningDate?: string;
  @IsOptional() @IsNumberString() basicPayment?: string;

  @IsOptional() @IsString() nameAsPerBank?: string;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() ifsc?: string;
  @IsOptional() @IsString() IFSC?: string;
  @IsOptional() @IsString() bankName?: string;

  @IsOptional() @IsString() panNo?: string;
  @IsOptional() @IsString() aadharNumber?: string;
  @IsOptional() @IsString() contactNumber?: string;
  @IsOptional() @IsString() emergencyContact?: string;

  @IsOptional() @IsString() shiftType?: string;
  @IsOptional() @IsString() referBy?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsBooleanString() shiftA?: string;
  @IsOptional() @IsBooleanString() shiftB?: string;
  @IsOptional() @IsString() referByDriverId?: string;
  @IsOptional() @IsString() referByDriverName?: string;
}

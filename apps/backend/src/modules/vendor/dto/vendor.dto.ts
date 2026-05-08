import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  Length,
} from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9 .,&'()/\-]{2,200}$/)
  supplierName!: string;

  @IsIn(['Rental', 'Adhoc'])
  venderSiteCode!: 'Rental' | 'Adhoc';

  @IsString()
  @Matches(/^[0-9]{10}$/)
  phoneNumber!: string;

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  townCity!: string;

  @IsString()
  state!: string;

  @IsString()
  @Matches(/^[0-9]{6}$/)
  pinCode!: string;

  @IsEmail()
  emailId!: string;

  @IsString()
  serviceRegistrationNumber!: string;

  @IsOptional() @IsString() serviceTax?: string;

  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
  panNumber!: string;

  @IsOptional() @IsString() tdsRateSection?: string;

  @IsString() beneficiaryName!: string;
  @IsString() accountNumber!: string;

  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
  IFSCcode!: string;

  @IsString() branchName!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}

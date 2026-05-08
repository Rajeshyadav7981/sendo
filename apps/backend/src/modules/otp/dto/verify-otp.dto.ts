import { IsString, Length, Matches } from 'class-validator';

export class VerifyPhoneOtpDto {
  @IsString()
  @Matches(/^\+?\d{6,15}$/)
  phone!: string;

  @IsString()
  @Length(4, 8)
  otp!: string;
}

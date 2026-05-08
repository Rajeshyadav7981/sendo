import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\+?\d{6,15}$/, { message: 'phone must be 6-15 digits, optional leading +' })
  phone!: string;
}

import { IsString } from 'class-validator';

export class CheckDriverDto {
  @IsString()
  driverId!: string;
}

export class CheckPhoneNumberDto {
  @IsString()
  phoneNumber!: string;
}

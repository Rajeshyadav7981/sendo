import { IsOptional, IsString } from 'class-validator';

export class DriverAddonDto {
  @IsString()
  driverId!: string;

  @IsString()
  shiftType!: string;

  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  referBy?: string;
}

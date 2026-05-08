import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export const VEHICLE_TYPES = [
  'Pickup Truck',
  '407 Truck',
  '17FT',
  '20FT',
  'Truck',
  'Bus',
  'Car',
  'Bike',
] as const;
export type VehicleTypeStr = (typeof VEHICLE_TYPES)[number];

export class CreateVehicleDto {
  @IsString()
  vehicleNumber!: string;

  @IsString()
  registerName!: string;

  @IsIn(VEHICLE_TYPES)
  vehicleType!: VehicleTypeStr;

  @IsString()
  grossVehicleWeight!: string;

  @IsDateString() registrationDate!: string;
  @IsDateString() fitnessValidUpto!: string;
  @IsDateString() taxValidUpto!: string;
  @IsDateString() insuranceValidUpto!: string;
  @IsDateString() pollutionValidUpto!: string;

  @IsOptional() @IsDateString() statePermitValidUpto?: string;
  @IsIn(['Yes', 'No']) nationalPermit!: 'Yes' | 'No';
  @IsOptional() @IsDateString() permitUpto?: string;
  @IsOptional() @IsIn(['Yes', 'No']) temporaryPermit?: 'Yes' | 'No';
  @IsOptional() @IsIn(['Yes', 'No']) statePermit?: 'Yes' | 'No';
  @IsOptional() @IsDateString() TemporarypermitUpto?: string;
  @IsOptional() @IsString() remarks?: string;

  @IsOptional() @IsString() chassisNumber?: string;
  @IsOptional() @IsString() engineNumber?: string;
  @IsOptional() @IsString() fuelType?: string;

  // Schedule fields — accept strings (form-data) and coerce server-side
  @IsOptional() @IsDateString() scheduleDate?: string;
  @IsOptional() @IsString() scheduleDay?: string;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleInterval?: number;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleLitres?: number;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleKmPerLitre?: number;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleKmPerFill?: number;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleKmActual?: number;
}

export const VEHICLE_DOC_KEYS = [
  'RegistrationCertificate',
  'Insurance',
  'PollutionCertificate',
  'RoadTax',
  'FitnessCertificate',
  'Permit',
  'StatePermit',
  'TemporaryPermit',
] as const;
export type VehicleDocKey = (typeof VEHICLE_DOC_KEYS)[number];

export class RenewDocumentDto {
  @IsString()
  vehicleNumber!: string;

  @IsIn(VEHICLE_DOC_KEYS)
  documentKey!: VehicleDocKey;

  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() issuingAuthority?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class VehicleScheduleDto {
  @IsOptional() @IsDateString() scheduleDate?: string;
  @IsOptional() @IsString() scheduleDay?: string;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleInterval?: number;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleLitres?: number;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleKmPerLitre?: number;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleKmPerFill?: number;
  @IsOptional() @Type(() => Number) @IsNumber() scheduleKmActual?: number;
}

export class UpdateVehicleDto {
  @IsOptional() @IsString() registerName?: string;
  @IsOptional() @IsIn(VEHICLE_TYPES) vehicleType?: VehicleTypeStr;
  @IsOptional() @IsString() grossVehicleWeight?: string;
  @IsOptional() @IsDateString() registrationDate?: string;
  @IsOptional() @IsDateString() fitnessValidUpto?: string;
  @IsOptional() @IsDateString() taxValidUpto?: string;
  @IsOptional() @IsDateString() insuranceValidUpto?: string;
  @IsOptional() @IsDateString() pollutionValidUpto?: string;
  @IsOptional() @IsIn(['Yes', 'No']) nationalPermit?: 'Yes' | 'No';
  @IsOptional() @IsDateString() permitUpto?: string;
  @IsOptional() @IsIn(['Yes', 'No']) statePermit?: 'Yes' | 'No';
  @IsOptional() @IsDateString() statePermitValidUpto?: string;
  @IsOptional() @IsIn(['Yes', 'No']) temporaryPermit?: 'Yes' | 'No';
  @IsOptional() @IsDateString() TemporarypermitUpto?: string;
  @IsOptional() @IsString() chassisNumber?: string;
  @IsOptional() @IsString() engineNumber?: string;
  @IsOptional() @IsString() fuelType?: string;
  @IsOptional() @IsString() remarks?: string;
}

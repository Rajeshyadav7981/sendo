import { IsIn, IsOptional, IsString } from 'class-validator';

export const MAINTENANCE_TYPES = [
  'Regular Maintenance',
  'Oil Service',
  'Tyre Service',
  'Battery Service',
  'RTO / Document Expense',
  'Spare Parts Service',
  'Inventory Service',
  'Loan',
] as const;
export type MaintenanceTypeStr = (typeof MAINTENANCE_TYPES)[number];

export class CreateTruckMaintenanceDto {
  @IsIn(MAINTENANCE_TYPES)
  maintenanceType!: MaintenanceTypeStr;

  // The remaining fields are accepted as a sparse blob and stored on `details`
  // (JSONB). The legacy schema had ~80 optional columns; we don't enforce them
  // at the column level but validate per-tab in the service if needed.
  @IsOptional() @IsString() truckNo?: string;
}

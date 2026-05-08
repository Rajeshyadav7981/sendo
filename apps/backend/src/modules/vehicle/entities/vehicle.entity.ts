import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VehicleType {
  PICKUP_TRUCK = 'Pickup Truck',
  TRUCK_407 = '407 Truck',
  TRUCK_17FT = '17FT',
  TRUCK_20FT = '20FT',
  TRUCK = 'Truck',
  BUS = 'Bus',
  CAR = 'Car',
  BIKE = 'Bike',
}

export enum YesNo {
  YES = 'Yes',
  NO = 'No',
}

export interface DocumentVersion {
  filePath?: string | null;
  documentNumber?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  issuingAuthority?: string;
  remarks?: string;
  uploadedAt: string;
  source: 'onboarding' | 'renewal';
}

export interface ScheduleDateHistoryEntry {
  scheduleDate: string | null;
  changedAt: string;
  source: 'onboarding' | 'edit';
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'vehicle_number', type: 'varchar', length: 32 })
  vehicleNumber!: string;

  @Column({ name: 'register_name', type: 'varchar', length: 200 })
  registerName!: string;

  @Column({ name: 'vehicle_type', type: 'enum', enum: VehicleType })
  vehicleType!: VehicleType;

  @Column({ name: 'gross_vehicle_weight', type: 'varchar', length: 50 })
  grossVehicleWeight!: string;

  @Column({ name: 'registration_date', type: 'date' })
  registrationDate!: Date;

  @Column({ name: 'fitness_valid_upto', type: 'date' })
  fitnessValidUpto!: Date;

  @Column({ name: 'tax_valid_upto', type: 'date' })
  taxValidUpto!: Date;

  @Column({ name: 'insurance_valid_upto', type: 'date' })
  insuranceValidUpto!: Date;

  @Column({ name: 'pollution_valid_upto', type: 'date' })
  pollutionValidUpto!: Date;

  @Column({ name: 'state_permit_valid_upto', type: 'date', nullable: true })
  statePermitValidUpto!: Date | null;

  @Column({ name: 'national_permit', type: 'enum', enum: YesNo })
  nationalPermit!: YesNo;

  @Column({ name: 'permit_upto', type: 'date', nullable: true })
  permitUpto!: Date | null;

  @Column({ name: 'temporary_permit', type: 'enum', enum: YesNo, default: YesNo.NO })
  temporaryPermit!: YesNo;

  @Column({ name: 'state_permit', type: 'enum', enum: YesNo, default: YesNo.NO })
  statePermit!: YesNo;

  @Column({ name: 'temporary_permit_upto', type: 'date', nullable: true })
  TemporarypermitUpto!: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ name: 'chassis_number', type: 'varchar', length: 100, nullable: true })
  chassisNumber!: string | null;

  @Column({ name: 'engine_number', type: 'varchar', length: 100, nullable: true })
  engineNumber!: string | null;

  @Column({ name: 'fuel_type', type: 'varchar', length: 50, nullable: true })
  fuelType!: string | null;

  @Column({ name: 'schedule_date', type: 'date', nullable: true })
  scheduleDate!: Date | null;

  @Column({ name: 'schedule_day', type: 'varchar', length: 20, nullable: true })
  scheduleDay!: string | null;

  @Column({ name: 'schedule_interval', type: 'int', nullable: true })
  scheduleInterval!: number | null;

  @Column({ name: 'schedule_litres', type: 'decimal', precision: 10, scale: 2, nullable: true })
  scheduleLitres!: string | null;

  @Column({ name: 'schedule_km_per_litre', type: 'decimal', precision: 10, scale: 2, nullable: true })
  scheduleKmPerLitre!: string | null;

  @Column({ name: 'schedule_km_per_fill', type: 'decimal', precision: 10, scale: 2, nullable: true })
  scheduleKmPerFill!: string | null;

  @Column({ name: 'schedule_km_actual', type: 'decimal', precision: 10, scale: 2, nullable: true })
  scheduleKmActual!: string | null;

  @Column({ name: 'schedule_date_history', type: 'jsonb', default: () => "'[]'::jsonb" })
  scheduleDateHistory!: ScheduleDateHistoryEntry[];

  @Column({ name: 'registration_certificate', type: 'text', nullable: true })
  RegistrationCertificate!: string | null;

  @Column({ name: 'insurance', type: 'text', nullable: true })
  Insurance!: string | null;

  @Column({ name: 'pollution_certificate', type: 'text', nullable: true })
  PollutionCertificate!: string | null;

  @Column({ name: 'road_tax', type: 'text', nullable: true })
  RoadTax!: string | null;

  @Column({ name: 'fitness_certificate', type: 'text', nullable: true })
  FitnessCertificate!: string | null;

  @Column({ name: 'permit', type: 'text', nullable: true })
  Permit!: string | null;

  @Column({ name: 'state_permit_doc', type: 'text', nullable: true })
  StatePermit!: string | null;

  @Column({ name: 'temporary_permit_doc', type: 'text', nullable: true })
  TemporaryPermit!: string | null;

  @Column({ name: 'document_history', type: 'jsonb', default: () => "'{}'::jsonb" })
  documentHistory!: Record<string, DocumentVersion[]>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'current_driver_id', type: 'varchar', length: 32, nullable: true })
  currentDriverId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

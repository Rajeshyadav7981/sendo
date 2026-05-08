import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('oil_services')
export class OilService {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 50, nullable: true })
  vehicleType!: string | null;

  @Column({ name: 'service_date', type: 'timestamptz', nullable: true })
  serviceDate!: Date | null;

  @Column({ name: 'odometer_reading', type: 'decimal', precision: 12, scale: 2, nullable: true })
  odometerReading!: string | null;

  @Column({ name: 'last_service_date', type: 'timestamptz', nullable: true })
  lastServiceDate!: Date | null;

  @Column({ name: 'oil_type', type: 'varchar', length: 100, nullable: true })
  oilType!: string | null;

  @Column({ name: 'oil_brand', type: 'varchar', length: 100, nullable: true })
  oilBrand!: string | null;

  @Column({ name: 'oil_quantity', type: 'decimal', precision: 10, scale: 2, nullable: true })
  oilQuantity!: string | null;

  @Column({ name: 'oil_grade', type: 'varchar', length: 50, nullable: true })
  oilGrade!: string | null;

  @Column({ name: 'service_center_name', type: 'varchar', length: 200, nullable: true })
  serviceCenterName!: string | null;

  @Column({ name: 'service_center', type: 'varchar', length: 200, nullable: true })
  serviceCenter!: string | null;

  @Column({ name: 'technician_name', type: 'varchar', length: 200, nullable: true })
  technicianName!: string | null;

  @Column({ name: 'contact_number', type: 'varchar', length: 32, nullable: true })
  contactNumber!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

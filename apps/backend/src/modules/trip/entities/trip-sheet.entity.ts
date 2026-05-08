import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('trip_sheets')
export class TripSheet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'trip_number', type: 'varchar', length: 100, nullable: true })
  tripNumber!: string | null;

  @Column({ name: 'vendor_name', type: 'varchar', length: 200, nullable: true })
  vendorName!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'driver_name', type: 'varchar', length: 200, nullable: true })
  driverName!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  origin!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  destination!: string | null;

  @Column({ name: 'loading_date', type: 'timestamptz', nullable: true })
  loadingDate!: Date | null;

  @Column({ name: 'unloading_date', type: 'timestamptz', nullable: true })
  unloadingDate!: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  material!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  weight!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  freight!: string | null;

  @Column({ name: 'advance_paid', type: 'decimal', precision: 12, scale: 2, nullable: true })
  advancePaid!: string | null;

  @Column({ name: 'balance_freight', type: 'decimal', precision: 12, scale: 2, nullable: true })
  balanceFreight!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'Pending' })
  status!: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 200, nullable: true })
  customerName!: string | null;

  @Column({ name: 'driver_id', type: 'varchar', length: 32, nullable: true })
  driverId!: string | null;

  @Column({ name: 'pod_url', type: 'text', nullable: true })
  podUrl!: string | null;

  @Column({ name: 'loading_slip_url', type: 'text', nullable: true })
  loadingSlipUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('diesel_entries')
@Index(['vehicleNumber', 'date'])
export class Diesel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz', nullable: true })
  date!: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  time!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 50, nullable: true })
  vehicleType!: string | null;

  @Column({ name: 'owner_name', type: 'varchar', length: 200, nullable: true })
  ownerName!: string | null;

  @Column({ name: 'driver_name', type: 'varchar', length: 200, nullable: true })
  driverName!: string | null;

  @Column({ name: 'vehicle_route', type: 'varchar', length: 200, nullable: true })
  vehicleRoute!: string | null;

  @Column({ name: 'pump_name', type: 'varchar', length: 200, nullable: true })
  pumpName!: string | null;

  @Column({ name: 'fuel_type', type: 'varchar', length: 50, nullable: true })
  fuelType!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  volume!: string | null;

  @Column({ name: 'rate_per_liter', type: 'decimal', precision: 10, scale: 2, nullable: true })
  ratePerLiter!: string | null;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ name: 'start_km', type: 'decimal', precision: 12, scale: 2, nullable: true })
  startKm!: string | null;

  @Column({ name: 'end_km', type: 'decimal', precision: 12, scale: 2, nullable: true })
  endKm!: string | null;

  @Column({ name: 'total_km', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalKm!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  mileage!: string | null;

  @Column({ name: 'payment_mode', type: 'varchar', length: 50, nullable: true })
  paymentMode!: string | null;

  @Column({ name: 'payment_type', type: 'varchar', length: 50, nullable: true })
  paymentType!: string | null;

  @Column({ name: 'paid_by', type: 'varchar', length: 200, nullable: true })
  paidBy!: string | null;

  @Column({ name: 'payment_reference', type: 'varchar', length: 200, nullable: true })
  paymentReference!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ name: 'diesel_slip_photo', type: 'text', nullable: true })
  dieselSlipPhoto!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

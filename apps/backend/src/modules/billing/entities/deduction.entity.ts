import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deductions')
export class Deduction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz', nullable: true })
  date!: Date | null;

  @Column({ name: 'driver_id', type: 'varchar', length: 32, nullable: true })
  driverId!: string | null;

  @Column({ name: 'driver_name', type: 'varchar', length: 200, nullable: true })
  driverName!: string | null;

  @Column({ name: 'driver_mobile', type: 'varchar', length: 32, nullable: true })
  driverMobile!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'loss_type', type: 'varchar', length: 100, nullable: true })
  lossType!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ name: 'recovery_status', type: 'varchar', length: 50, nullable: true })
  recoveryStatus!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

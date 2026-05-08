import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vendor_advances')
export class VendorAdvance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_name', type: 'varchar', length: 200, nullable: true })
  vendorName!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'advance_type', type: 'varchar', length: 100, nullable: true })
  advanceType!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  date!: Date | null;

  @Column({ name: 'payment_mode', type: 'varchar', length: 50, nullable: true })
  paymentMode!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'Pending' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

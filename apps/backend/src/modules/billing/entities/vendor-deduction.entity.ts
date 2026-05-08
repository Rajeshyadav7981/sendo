import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vendor_deductions')
export class VendorDeduction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_name', type: 'varchar', length: 200, nullable: true })
  vendorName!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'deduction_type', type: 'varchar', length: 100, nullable: true })
  deductionType!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  date!: Date | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'trip_number', type: 'varchar', length: 100, nullable: true })
  tripNumber!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

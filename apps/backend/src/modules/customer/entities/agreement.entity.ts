import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('agreements')
export class Agreement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 200, nullable: true })
  customerName!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'agreement_type', type: 'varchar', length: 100, nullable: true })
  agreementType!: string | null;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate!: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate!: Date | null;

  @Column({ name: 'rate_per_km', type: 'decimal', precision: 12, scale: 2, nullable: true })
  ratePerKm!: string | null;

  @Column({ name: 'fixed_rate', type: 'decimal', precision: 12, scale: 2, nullable: true })
  fixedRate!: string | null;

  @Column({ name: 'payment_terms', type: 'varchar', length: 200, nullable: true })
  paymentTerms!: string | null;

  @Column({ type: 'text', nullable: true })
  terms!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vendor_payments')
export class VendorPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_name', type: 'varchar', length: 200, nullable: true })
  vendorName!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
  invoiceNumber!: string | null;

  @Column({ name: 'trip_number', type: 'varchar', length: 100, nullable: true })
  tripNumber!: string | null;

  @Column({ name: 'gross_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  grossAmount!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  deductions!: string | null;

  @Column({ name: 'net_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  netAmount!: string | null;

  @Column({ name: 'payment_date', type: 'timestamptz', nullable: true })
  paymentDate!: Date | null;

  @Column({ name: 'payment_mode', type: 'varchar', length: 50, nullable: true })
  paymentMode!: string | null;

  @Column({ name: 'utr_number', type: 'varchar', length: 100, nullable: true })
  utrNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'Pending' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

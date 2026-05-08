import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('gst_entries')
export class GstEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 200, nullable: true })
  customerName!: string | null;

  @Column({ name: 'gst_number', type: 'varchar', length: 32, nullable: true })
  gstNumber!: string | null;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
  invoiceNumber!: string | null;

  @Column({ name: 'invoice_date', type: 'timestamptz', nullable: true })
  invoiceDate!: Date | null;

  @Column({ name: 'taxable_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  taxableAmount!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cgst!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  sgst!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  igst!: string | null;

  @Column({ name: 'total_gst', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalGST!: string | null;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount!: string | null;

  @Column({ name: 'filing_period', type: 'varchar', length: 50, nullable: true })
  filingPeriod!: string | null;

  @Column({ name: 'filing_status', type: 'varchar', length: 50, default: 'Pending' })
  filingStatus!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

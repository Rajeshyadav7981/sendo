import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customer_invoices')
export class CustomerInvoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
  invoiceNumber!: string | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 200, nullable: true })
  customerName!: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'trip_from', type: 'varchar', length: 200, nullable: true })
  tripFrom!: string | null;

  @Column({ name: 'trip_to', type: 'varchar', length: 200, nullable: true })
  tripTo!: string | null;

  @Column({ name: 'invoice_date', type: 'timestamptz', nullable: true })
  invoiceDate!: Date | null;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ name: 'gst_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  gstAmount!: string | null;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'Unpaid' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

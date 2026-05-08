import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customer_payments')
export class CustomerPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 200, nullable: true })
  customerName!: string | null;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
  invoiceNumber!: string | null;

  @Column({ name: 'invoice_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  invoiceAmount!: string | null;

  @Column({ name: 'amount_received', type: 'decimal', precision: 12, scale: 2, nullable: true })
  amountReceived!: string | null;

  @Column({ name: 'balance_due', type: 'decimal', precision: 12, scale: 2, nullable: true })
  balanceDue!: string | null;

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

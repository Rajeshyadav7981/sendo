import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExpenseType {
  VEHICLE_EXPENSE = 'Vehicle Expense',
  OTHERS = 'Others',
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  CHEQUE = 'Cheque',
  UPI = 'UPI',
  BANK_TRANSFER = 'Bank Transfer',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz', nullable: true })
  date!: Date | null;

  @Column({ name: 'expense_type', type: 'enum', enum: ExpenseType, nullable: true })
  expenseType!: ExpenseType | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 32, nullable: true })
  vehicleNumber!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  vendor!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ name: 'requested_by', type: 'varchar', length: 200, nullable: true })
  requestedBy!: string | null;

  @Column({ name: 'paid_by', type: 'varchar', length: 200, nullable: true })
  paidBy!: string | null;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod!: PaymentMethod | null;

  @Column({ name: 'payment_reference', type: 'varchar', length: 200, nullable: true })
  paymentReference!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

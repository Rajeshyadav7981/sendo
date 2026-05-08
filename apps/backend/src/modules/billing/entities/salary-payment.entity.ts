import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('salary_payments')
@Index(['driverId', 'salaryMonth'])
export class SalaryPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'salary_month', type: 'varchar', length: 32 })
  salaryMonth!: string;

  @Column({ name: 'driver_id', type: 'varchar', length: 32 })
  driverId!: string;

  @Column({ name: 'driver_name', type: 'varchar', length: 200 })
  driverName!: string;

  @Column({ name: 'no_of_days', type: 'int' })
  noOfDays!: number;

  @Column({ name: 'basic_payment', type: 'decimal', precision: 12, scale: 2 })
  basicPayment!: string;

  @Column({ name: 'per_day_payment', type: 'decimal', precision: 12, scale: 2 })
  perDayPayment!: string;

  @Column({ name: 'working_days', type: 'int' })
  workingDays!: number;

  @Column({ name: 'earned_payment', type: 'decimal', precision: 12, scale: 2 })
  earnedPayment!: string;

  @Column({ type: 'int' })
  absent!: number;

  @Column({ name: 'referral_bonus', type: 'decimal', precision: 12, scale: 2 })
  referralBonus!: string;

  @Column({ name: 'advance_deduction', type: 'decimal', precision: 12, scale: 2 })
  advanceDeduction!: string;

  @Column({ name: 'other_deduction', type: 'decimal', precision: 12, scale: 2 })
  otherDeduction!: string;

  @Column({ name: 'payable_amount', type: 'decimal', precision: 12, scale: 2 })
  payableAmount!: string;

  @Column({ name: 'approval_status', type: 'varchar', length: 50 })
  approvalStatus!: string;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount!: string;

  @Column({ name: 'paid_date', type: 'timestamptz', nullable: true })
  paidDate!: Date | null;

  @Column({ type: 'text', default: '' })
  remarks!: string;

  @Column({ type: 'boolean', default: false })
  approve!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

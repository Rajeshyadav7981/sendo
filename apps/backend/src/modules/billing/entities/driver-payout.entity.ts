import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('driver_payouts')
@Index(['driverId', 'month'], { unique: true })
export class DriverPayout {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'driver_id', type: 'varchar', length: 32 })
  driverId!: string;

  @Column({ type: 'varchar', length: 32 })
  month!: string;

  @Column({ name: 'total_days', type: 'int', nullable: true })
  totalDays!: number | null;

  @Column({ name: 'daily_wage', type: 'decimal', precision: 12, scale: 2, nullable: true })
  dailyWage!: string | null;

  @Column({ name: 'basic_payment', type: 'decimal', precision: 12, scale: 2, nullable: true })
  basicPayment!: string | null;

  @Column({ name: 'total_working_days', type: 'int', nullable: true })
  totalWorkingDays!: number | null;

  @Column({ name: 'total_holidays', type: 'int', nullable: true })
  totalHolidays!: number | null;

  @Column({ name: 'earned_payment', type: 'decimal', precision: 12, scale: 2, nullable: true })
  earnedPayment!: string | null;

  @Column({ name: 'approved_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  approvedAmount!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  deductions!: string | null;

  @Column({ name: 'other_expenses', type: 'decimal', precision: 12, scale: 2, nullable: true })
  otherExpenses!: string | null;

  @Column({ name: 'payable_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  payableAmount!: string | null;

  @Column({ name: 'attendance_data', type: 'jsonb', default: () => "'[]'::jsonb" })
  attendanceData!: Array<{ date: string; status: string }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

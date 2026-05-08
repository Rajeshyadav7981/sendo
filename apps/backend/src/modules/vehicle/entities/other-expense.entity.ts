import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('other_expenses')
export class OtherExpense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  date!: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount!: string | null;

  @Column({ name: 'paid_by', type: 'varchar', length: 200, nullable: true })
  paidBy!: string | null;

  @Column({ name: 'payment_mode', type: 'varchar', length: 50, nullable: true })
  paymentMode!: string | null;

  @Column({ name: 'approved_by', type: 'varchar', length: 200, nullable: true })
  approvedBy!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

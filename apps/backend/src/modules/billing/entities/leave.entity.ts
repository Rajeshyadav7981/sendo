import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalStatus } from './driver-advance.entity';

@Entity('leaves')
@Index(['driverId', 'status'])
export class Leave {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'driver_id', type: 'varchar', length: 32 })
  driverId!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: Date;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status!: ApprovalStatus;

  @Column({ name: 'leave_type', type: 'varchar', length: 50, nullable: true })
  leaveType!: string | null;

  @Column({ name: 'approved_by', type: 'varchar', length: 200, nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'rejected_reason', type: 'text', nullable: true })
  rejectedReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

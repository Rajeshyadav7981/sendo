import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('driver_advances')
@Index(['driverId', 'approvalStatus', 'month'])
export class DriverAdvance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'driver_id', type: 'varchar', length: 32 })
  driverId!: string;

  @Column({ name: 'driver_name', type: 'varchar', length: 200 })
  driverName!: string;

  @Column({ type: 'varchar', length: 32 })
  month!: string;

  @Column({ name: 'requested_amount', type: 'decimal', precision: 12, scale: 2 })
  requestedAmount!: string;

  @Column({ name: 'approved_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  approvedAmount!: string;

  @Column({ name: 'approval_status', type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  approvalStatus!: ApprovalStatus;

  @CreateDateColumn({ name: 'requested_at' })
  requestedAt!: Date;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'approved_by', type: 'varchar', length: 200, nullable: true })
  approvedBy!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ name: 'rejected_reason', type: 'text', nullable: true })
  rejectedReason!: string | null;
}

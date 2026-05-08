import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  ADVANCE_REQUESTED = 'advance_requested',
  ADVANCE_APPROVED = 'advance_approved',
  ADVANCE_REJECTED = 'advance_rejected',
  LEAVE_REQUESTED = 'leave_requested',
  LEAVE_APPROVED = 'leave_approved',
  LEAVE_REJECTED = 'leave_rejected',
  ATTENDANCE_APPROVED = 'attendance_approved',
  ATTENDANCE_REJECTED = 'attendance_rejected',
  DOCUMENT_EXPIRING = 'document_expiring',
  DOCUMENT_EXPIRED = 'document_expired',
  TRIP_ASSIGNED = 'trip_assigned',
  TRIP_STARTED = 'trip_started',
  TRIP_ENDED = 'trip_ended',
  ESCALATION_RAISED = 'escalation_raised',
  ESCALATION_RESOLVED = 'escalation_resolved',
  SALARY_APPROVED = 'salary_approved',
  SALARY_PAID = 'salary_paid',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['recipientUserId', 'readAt'])
@Index(['recipientDriverId', 'readAt'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'recipient_user_id', type: 'uuid', nullable: true })
  recipientUserId!: string | null;

  @Column({ name: 'recipient_driver_id', type: 'varchar', length: 32, nullable: true })
  recipientDriverId!: string | null;

  @Column({ name: 'recipient_role', type: 'varchar', length: 32, nullable: true })
  recipientRole!: string | null;

  @Column({ type: 'enum', enum: NotificationType, enumName: 'notifications_type_enum' })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  payload!: Record<string, unknown>;

  @Column({ name: 'entity_type', type: 'varchar', length: 64, nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 64, nullable: true })
  entityId!: string | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EscalationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum EscalationStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  REOPENED = 'reopened',
}

@Entity('tracker_escalations')
@Index(['vehicle'])
@Index(['status'])
export class Escalation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  vehicle!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'enum', enum: EscalationSeverity, default: EscalationSeverity.MEDIUM })
  severity!: EscalationSeverity;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ name: 'raised_by', type: 'varchar', length: 200, nullable: true })
  raisedBy!: string | null;

  @Column({ type: 'enum', enum: EscalationStatus, default: EscalationStatus.OPEN })
  status!: EscalationStatus;

  @Column({ name: 'resolved_by', type: 'varchar', length: 200, nullable: true })
  resolvedBy!: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  LOGIN = 'login',
  LOGOUT = 'logout',
  OTHER = 'other',
}

@Entity('audit_log')
@Index(['entityType', 'entityId'])
@Index(['actorUserId', 'createdAt'])
@Index(['actorDriverId', 'createdAt'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: AuditAction, enumName: 'audit_log_action_enum' })
  action!: AuditAction;

  @Column({ name: 'entity_type', type: 'varchar', length: 64, nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 64, nullable: true })
  entityId!: string | null;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ name: 'actor_driver_id', type: 'varchar', length: 32, nullable: true })
  actorDriverId!: string | null;

  @Column({ name: 'actor_label', type: 'varchar', length: 200, nullable: true })
  actorLabel!: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 32, nullable: true })
  actorRole!: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  method!: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  route!: string | null;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode!: number | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 256, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

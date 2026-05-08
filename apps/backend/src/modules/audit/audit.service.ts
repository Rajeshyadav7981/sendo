import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditLog } from './entities/audit-log.entity';

export interface RecordAuditInput {
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | null;
  actorUserId?: string | null;
  actorDriverId?: string | null;
  actorLabel?: string | null;
  actorRole?: string | null;
  method?: string | null;
  route?: string | null;
  statusCode?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>) {}

  async record(input: RecordAuditInput): Promise<void> {
    try {
      const row = this.logs.create({
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        actorUserId: input.actorUserId ?? null,
        actorDriverId: input.actorDriverId ?? null,
        actorLabel: input.actorLabel ?? null,
        actorRole: input.actorRole ?? null,
        method: input.method ?? null,
        route: input.route ?? null,
        statusCode: input.statusCode ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        before: input.before ?? null,
        after: input.after ?? null,
        metadata: input.metadata ?? {},
      });
      await this.logs.save(row);
    } catch (err) {
      this.logger.warn(`audit_log insert failed: ${(err as Error).message}`);
    }
  }
}

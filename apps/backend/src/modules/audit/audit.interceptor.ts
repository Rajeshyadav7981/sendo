import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Observable, tap } from 'rxjs';
import { AuditAction } from './entities/audit-log.entity';
import { AuditService } from './audit.service';

const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface AuthedReq extends FastifyRequest {
  user?: {
    id?: string;
    sub?: string;
    fullName?: string;
    role?: string;
    email?: string;
    driverId?: string;
  };
}

/**
 * Logs every non-GET request to audit_log. Action is inferred from method
 * + path; entityType is inferred from the URL's first segment. Bodies are
 * persisted whole — keep this off for endpoints that handle secrets if a
 * caller adds @SkipAudit() later (not implemented yet).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<AuthedReq>();
    const method = (req.method ?? '').toUpperCase();

    if (!AUDITED_METHODS.has(method)) return next.handle();

    return next.handle().pipe(
      tap({
        next: (response) => this.persist(req, method, response, null),
        error: (err) => this.persist(req, method, null, err as Error),
      }),
    );
  }

  private persist(req: AuthedReq, method: string, response: unknown, err: Error | null): void {
    const url = req.url ?? '';
    const path = url.split('?')[0] ?? url;
    const entityType = path.split('/').filter(Boolean)[0] ?? null;
    const action = inferAction(method, path);
    const reqBody = (req.body ?? null) as Record<string, unknown> | null;
    const resBody = isPlainObject(response) ? (response as Record<string, unknown>) : null;
    const entityId =
      (resBody?.id as string | undefined) ??
      (reqBody?.id as string | undefined) ??
      extractIdParam(path);
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.ip ??
      null;

    const statusCode = err ? (err as { status?: number }).status ?? 500 : 200;

    void this.audit.record({
      action,
      entityType,
      entityId: entityId ?? null,
      actorUserId: req.user?.id ?? req.user?.sub ?? null,
      actorDriverId: req.user?.driverId ?? null,
      actorLabel: req.user?.fullName ?? req.user?.email ?? null,
      actorRole: req.user?.role ?? null,
      method,
      route: path,
      statusCode,
      ipAddress: ip,
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
      before: null,
      after: resBody,
      metadata: err ? { error: err.message } : {},
    });
  }
}

function inferAction(method: string, path: string): AuditAction {
  if (method === 'POST') {
    if (/\/login\b/i.test(path)) return AuditAction.LOGIN;
    if (/\/logout\b/i.test(path)) return AuditAction.LOGOUT;
    if (/\bapprove\b/i.test(path)) return AuditAction.APPROVE;
    return AuditAction.CREATE;
  }
  if (method === 'PUT' || method === 'PATCH') {
    if (/\bapprove\b/i.test(path)) return AuditAction.APPROVE;
    if (/\breject\b/i.test(path)) return AuditAction.REJECT;
    return AuditAction.UPDATE;
  }
  if (method === 'DELETE') return AuditAction.DELETE;
  return AuditAction.OTHER;
}

function extractIdParam(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return seg;
  }
  return null;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

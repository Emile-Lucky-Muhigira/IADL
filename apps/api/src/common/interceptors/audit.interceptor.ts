import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const SENSITIVE_KEYS = ['password', 'newPassword', 'currentPassword', 'passwordHash', 'accessToken'];

function redact(body: any): any {
  if (!body || typeof body !== 'object') return undefined;
  const copy: Record<string, any> = { ...body };
  for (const key of SENSITIVE_KEYS) if (key in copy) copy[key] = '***';
  return copy;
}

/**
 * Records an audit trail for write operations. Runs AFTER the auth guard, so the
 * authenticated user is available (the previous middleware ran before guards and
 * therefore never captured a user). Sensitive fields are redacted before storage.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    return next.handle().pipe(
      tap(() => {
        if (!user || !WRITE_METHODS.includes(req.method)) return;
        const parts: string[] = (req.path || '').split('/').filter(Boolean); // ['api','v1','users',':id']
        const resource = parts[2] ?? 'unknown';
        const resourceId = req.params?.id ?? parts[3] ?? null;

        this.prisma.auditLog
          .create({
            data: {
              userId: user.id,
              tenantId: user.tenantId ?? null,
              action: req.method,
              resource,
              resourceId,
              newData: redact(req.body),
              ipAddress: req.ip,
              userAgent: req.headers?.['user-agent'],
            },
          })
          .catch(() => {});
      }),
    );
  }
}

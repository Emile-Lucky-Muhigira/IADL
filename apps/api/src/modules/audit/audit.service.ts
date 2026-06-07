import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, isGlobalRole } from '../../common/utils/tenant.util';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async list(actor: AuthUser, page = 1, limit = 20, resource?: string) {
    const where: any = {};
    if (!isGlobalRole(actor.role)) where.tenantId = actor.tenantId;
    if (resource) where.resource = resource;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    // AuditLog has no FK relation to User, so enrich actor names with one extra query.
    const userIds = [...new Set(logs.map((l) => l.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const data = logs.map((l) => ({ ...l, actor: byId.get(l.userId) ?? null }));
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (user && writeMethods.includes(req.method)) {
      const resource = req.path.split('/')[3] ?? 'unknown';
      const resourceId = req.params?.id;

      this.prisma.auditLog
        .create({
          data: {
            userId: user.id,
            tenantId: user.tenantId,
            action: req.method,
            resource,
            resourceId,
            newData: req.body,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        })
        .catch(() => {});
    }

    next();
  }
}

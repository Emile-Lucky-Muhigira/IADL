import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums/roles.enum';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADL_ADMIN) return true;

    const tenantId = request.params?.tenantId || request.body?.tenantId || request.query?.tenantId;

    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access is not permitted');
    }

    return true;
  }
}

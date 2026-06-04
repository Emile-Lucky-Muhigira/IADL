import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../enums/roles.enum';
import { PrismaService } from '../../prisma/prisma.service';

/** Minimal shape of the authenticated principal attached to the request by JwtStrategy. */
export interface AuthUser {
  id: string;
  role: UserRole;
  tenantId: string | null;
}

/** Global roles operate across all tenants (no tenant scoping). */
export function isGlobalRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADL_ADMIN;
}

/**
 * Enforce that a tenant-scoped resource belongs to the caller's tenant.
 * Global roles (SUPER_ADMIN / ADL_ADMIN) bypass the check. Everyone else is
 * blocked from touching any resource outside their own tenant.
 */
export function assertSameTenant(
  resourceTenantId: string | null | undefined,
  user: Pick<AuthUser, 'role' | 'tenantId'>,
): void {
  if (isGlobalRole(user.role)) return;
  if (!resourceTenantId || resourceTenantId !== user.tenantId) {
    throw new ForbiddenException('Cross-tenant access is not permitted');
  }
}

/**
 * Enforce that the caller is allowed to read a specific student's records.
 * Allowed: global admins, the student themselves, a linked parent, or
 * same-tenant staff. Returns the student's tenantId for further scoping.
 */
export async function assertCanAccessStudent(
  prisma: PrismaService,
  studentId: string,
  actor: AuthUser,
): Promise<string | null> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { tenantId: true },
  });
  if (!student) throw new NotFoundException('Student not found');

  if (isGlobalRole(actor.role)) return student.tenantId;

  if (actor.role === UserRole.STUDENT) {
    if (actor.id !== studentId) throw new ForbiddenException('You can only access your own records');
    return student.tenantId;
  }

  if (actor.role === UserRole.PARENT) {
    const link = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: actor.id, studentId } },
    });
    if (!link) throw new ForbiddenException('You are not linked to this student');
    return student.tenantId;
  }

  // Remaining staff roles (gatekeeper, trainer, accountant, auditor) are tenant-scoped.
  assertSameTenant(student.tenantId, actor);
  return student.tenantId;
}

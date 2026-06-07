import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UserRole } from '../../common/enums/roles.enum';
import { AuthUser, assertSameTenant, isGlobalRole } from '../../common/utils/tenant.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private authService: AuthService) {}

  async create(dto: CreateUserDto, createdBy: { role: UserRole; tenantId: string | null }) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('User with this email already exists');

    if (createdBy.role === UserRole.SCHOOL_GATEKEEPER) {
      if (!dto.tenantId || dto.tenantId !== createdBy.tenantId) {
        throw new ForbiddenException('You can only create users within your school');
      }
      const allowedRoles = [UserRole.TRAINER, UserRole.STUDENT, UserRole.ACCOUNTANT, UserRole.SYSTEM_AUDITOR];
      if (!allowedRoles.includes(dto.role)) {
        throw new ForbiddenException('You cannot create users with this role');
      }
    }

    const passwordHash = await this.authService.hashPassword(dto.password);
    const { password, ...userData } = dto;

    return this.prisma.user.create({
      data: { ...userData, passwordHash },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, tenantId: true, isActive: true, createdAt: true,
      },
    });
  }

  async findAll(tenantId?: string, role?: UserRole, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, role: true, tenantId: true, isActive: true,
          lastLoginAt: true, createdAt: true,
          tenant: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        avatarUrl: true, role: true, tenantId: true, isActive: true,
        lastLoginAt: true, createdAt: true,
        tenant: { select: { id: true, name: true, domain: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    assertSameTenant(user.tenantId, actor);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.findOne(id, actor);

    // Non-global admins (e.g. gatekeepers) may not assign elevated/global roles.
    if (dto.role && !isGlobalRole(actor.role)) {
      const allowed = [UserRole.TRAINER, UserRole.STUDENT, UserRole.ACCOUNTANT, UserRole.PARENT, UserRole.SYSTEM_AUDITOR];
      if (!allowed.includes(dto.role)) {
        throw new ForbiddenException('You cannot assign this role');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatarUrl: true, role: true, tenantId: true,
      },
    });
  }

  async deactivate(id: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.findOne(id, actor);
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async resetPassword(id: string, newPassword: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.findOne(id, actor); // enforces tenant scope
    const passwordHash = await this.authService.hashPassword(newPassword);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Password reset successfully' };
  }

  async linkParentToStudent(parentId: string, studentId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const [parent, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: parentId, role: 'PARENT' } }),
      this.prisma.user.findUnique({ where: { id: studentId, role: 'STUDENT' } }),
    ]);
    if (!parent) throw new NotFoundException('Parent not found');
    if (!student) throw new NotFoundException('Student not found');
    assertSameTenant(parent.tenantId, actor);
    assertSameTenant(student.tenantId, actor);

    return this.prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      create: { parentId, studentId },
      update: {},
    });
  }

  async getParentStudents(parentId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const parent = await this.prisma.user.findUnique({ where: { id: parentId }, select: { tenantId: true } });
    if (!parent) throw new NotFoundException('Parent not found');
    assertSameTenant(parent.tenantId, actor);

    return this.prisma.parentStudent.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            enrollments: { include: { course: { select: { title: true } } } },
          },
        },
      },
    });
  }
}

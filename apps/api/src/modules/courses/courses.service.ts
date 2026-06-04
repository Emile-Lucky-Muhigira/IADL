import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { UserRole } from '../../common/enums/roles.enum';
import { AuthUser, assertSameTenant } from '../../common/utils/tenant.util';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseDto, user: { id: string; tenantId: string | null; role: UserRole }) {
    if (!user.tenantId && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADL_ADMIN) {
      throw new ForbiddenException('No tenant associated with this account');
    }

    const { trainerIds, ...courseData } = dto;

    return this.prisma.course.create({
      data: {
        ...courseData,
        tenantId: user.tenantId!,
        trainers: trainerIds ? { connect: trainerIds.map((id) => ({ id })) } : undefined,
      },
      include: { trainers: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findAll(tenantId?: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };
    if (tenantId) where.tenantId = tenantId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trainers: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { enrollments: true, sessions: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user: Pick<AuthUser, 'role' | 'tenantId'>) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        trainers: { select: { id: true, firstName: true, lastName: true, email: true } },
        sessions: { orderBy: { scheduledAt: 'asc' }, take: 10 },
        assessments: true,
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    assertSameTenant(course.tenantId, user);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, user: { tenantId: string | null; role: UserRole }) {
    await this.findOne(id, user);

    const { trainerIds, ...updateData } = dto;

    return this.prisma.course.update({
      where: { id },
      data: {
        ...updateData,
        trainers: trainerIds ? { set: trainerIds.map((tid) => ({ id: tid })) } : undefined,
      },
      include: { trainers: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async deactivate(id: string, user: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.findOne(id, user);
    return this.prisma.course.update({ where: { id }, data: { isActive: false } });
  }
}

import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, assertSameTenant } from '../../common/utils/tenant.util';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: string, courseId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const [user, course] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.course.findUnique({ where: { id: courseId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!course) throw new NotFoundException('Course not found');

    // Caller may only act within their own tenant, and a student can only be
    // enrolled in a course belonging to that same school.
    assertSameTenant(course.tenantId, actor);
    assertSameTenant(user.tenantId, actor);
    if (user.tenantId !== course.tenantId) {
      throw new BadRequestException('Student and course belong to different schools');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing && existing.status === 'ACTIVE') {
      throw new ConflictException('Student is already enrolled in this course');
    }

    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: 'ACTIVE' },
      update: { status: 'ACTIVE', enrolledAt: new Date() },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async findByStudent(userId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const student = await this.prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!student) throw new NotFoundException('Student not found');
    assertSameTenant(student.tenantId, actor);

    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true, title: true, description: true, duration: true, thumbnailUrl: true,
            trainers: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findByCourse(courseId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>, page = 1, limit = 20) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { tenantId: true } });
    if (!course) throw new NotFoundException('Course not found');
    assertSameTenant(course.tenantId, actor);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        skip,
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { courseId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateStatus(
    userId: string,
    courseId: string,
    status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED',
    actor: Pick<AuthUser, 'role' | 'tenantId'>,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { course: { select: { tenantId: true } } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    assertSameTenant(enrollment.course.tenantId, actor);
    return this.prisma.enrollment.update({ where: { userId_courseId: { userId, courseId } }, data: { status } });
  }
}

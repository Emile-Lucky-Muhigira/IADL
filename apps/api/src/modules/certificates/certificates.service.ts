import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, assertCanAccessStudent } from '../../common/utils/tenant.util';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async issue(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Student is not enrolled in this course');
    if (enrollment.status !== 'COMPLETED') {
      throw new ConflictException('Student must complete the course before a certificate can be issued');
    }

    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Certificate already issued');

    return this.prisma.certificate.create({
      data: { userId, courseId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async verify(uniqueCode: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { uniqueCode },
      include: {
        user: { select: { firstName: true, lastName: true } },
        course: { select: { title: true } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found or invalid');
    return cert;
  }

  async findByStudent(userId: string, actor: AuthUser) {
    await assertCanAccessStudent(this.prisma, userId, actor);

    return this.prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, duration: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findByTenant(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { course: { tenantId } },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.certificate.count({ where: { course: { tenantId } } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}

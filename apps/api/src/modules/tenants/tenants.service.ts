import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const exists = await this.prisma.tenant.findUnique({ where: { domain: dto.domain } });
    if (exists) throw new ConflictException('A school with this domain already exists');

    return this.prisma.tenant.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, courses: true } } },
      }),
      this.prisma.tenant.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true, courses: true } } },
    });
    if (!tenant) throw new NotFoundException('School not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
  }

  async getStats(id: string) {
    const [students, trainers, courses, revenue] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id, role: 'STUDENT' } }),
      this.prisma.user.count({ where: { tenantId: id, role: 'TRAINER' } }),
      this.prisma.course.count({ where: { tenantId: id, isActive: true } }),
      this.prisma.ledgerEntry.aggregate({
        where: { tenantId: id, type: 'CREDIT' },
        _sum: { amount: true },
      }),
    ]);

    return {
      students,
      trainers,
      courses,
      totalRevenue: revenue._sum.amount ?? 0,
    };
  }
}

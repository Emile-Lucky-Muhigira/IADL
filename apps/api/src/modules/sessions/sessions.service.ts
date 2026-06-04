import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, assertSameTenant } from '../../common/utils/tenant.util';
import { IsString, IsDateString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty() @IsString() courseId: string;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsDateString() scheduledAt: string;
  @ApiProperty({ description: 'Duration in minutes' }) @IsNumber() @Min(15) duration: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() meetingUrl?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() duration?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() meetingUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recordingUrl?: string;
}

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSessionDto, user: Pick<AuthUser, 'role' | 'tenantId'>) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');
    assertSameTenant(course.tenantId, user);

    return this.prisma.session.create({
      data: { ...dto, tenantId: course.tenantId, scheduledAt: new Date(dto.scheduledAt) },
      include: { course: { select: { id: true, title: true } } },
    });
  }

  async findByCourse(courseId: string, user: Pick<AuthUser, 'role' | 'tenantId'>, page = 1, limit = 20) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { tenantId: true } });
    if (!course) throw new NotFoundException('Course not found');
    assertSameTenant(course.tenantId, user);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { courseId },
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: { _count: { select: { attendances: true } } },
      }),
      this.prisma.session.count({ where: { courseId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findByTenant(tenantId: string, upcoming = false, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (upcoming) where.scheduledAt = { gte: new Date() };

    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          course: { select: { id: true, title: true } },
          _count: { select: { attendances: true } },
        },
      }),
      this.prisma.session.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user: Pick<AuthUser, 'role' | 'tenantId'>) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        attendances: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    assertSameTenant(session.tenantId, user);
    return session;
  }

  async update(id: string, dto: UpdateSessionDto, user: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.findOne(id, user);
    const data: any = { ...dto };
    if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);
    return this.prisma.session.update({ where: { id }, data });
  }

  async delete(id: string, user: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.findOne(id, user);
    return this.prisma.session.delete({ where: { id } });
  }
}

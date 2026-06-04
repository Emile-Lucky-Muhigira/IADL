import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, assertCanAccessStudent } from '../../common/utils/tenant.util';
import { IsString, IsNumber, IsEnum, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { randomUUID } from 'crypto';

export class CreateLedgerEntryDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty({ enum: ['DEBIT', 'CREDIT', 'REFUND'] })
  @IsEnum(['DEBIT', 'CREDIT', 'REFUND'])
  type: 'DEBIT' | 'CREDIT' | 'REFUND';
  @ApiProperty() @IsNumber() @IsPositive() amount: number;
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createEntry(dto: CreateLedgerEntryDto, tenantId: string, createdById: string) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId, tenantId } });
    if (!user) throw new NotFoundException('Student/user not found in this school');

    const lastEntry = await this.prisma.ledgerEntry.findFirst({
      where: { userId: dto.userId, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const previousBalance = lastEntry ? Number(lastEntry.balance) : 0;
    const newBalance =
      dto.type === 'CREDIT' || dto.type === 'REFUND'
        ? previousBalance - dto.amount
        : previousBalance + dto.amount;

    return this.prisma.ledgerEntry.create({
      data: {
        tenantId,
        userId: dto.userId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        reference: dto.reference ?? `REF-${randomUUID().slice(0, 8).toUpperCase()}`,
        balance: newBalance,
        createdById,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getStudentLedger(userId: string, actor: AuthUser, page = 1, limit = 20) {
    const tenantId = await assertCanAccessStudent(this.prisma, userId, actor);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { userId, tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ledgerEntry.count({ where: { userId, tenantId } }),
    ]);

    const latestEntry = data[0];
    const currentBalance = latestEntry ? Number(latestEntry.balance) : 0;

    return {
      data,
      currentBalance,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBranchLedger(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.ledgerEntry.count({ where: { tenantId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getFinancialSummary(tenantId: string) {
    const [totalRevenue, totalOutstanding, recentPayments] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { tenantId, type: 'CREDIT' },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.groupBy({
        by: ['userId'],
        where: { tenantId },
        _sum: { balance: true },
      }),
      this.prisma.ledgerEntry.findMany({
        where: { tenantId, type: 'CREDIT' },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const studentsWithDebt = totalOutstanding.filter((e) => Number(e._sum.balance) > 0).length;

    return {
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      studentsWithOutstandingBalance: studentsWithDebt,
      recentPayments,
    };
  }

  async getStudentsWithOutstanding(tenantId: string) {
    const students = await this.prisma.user.findMany({
      where: { tenantId, role: 'STUDENT' },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return students
      .map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        balance: s.ledgerEntries[0] ? Number(s.ledgerEntries[0].balance) : 0,
      }))
      .filter((s) => s.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }
}

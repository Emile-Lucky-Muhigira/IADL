import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, assertSameTenant, assertCanAccessStudent } from '../../common/utils/tenant.util';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /** Load a session and enforce that the caller may act within its tenant. */
  private async getScopedSession(sessionId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    assertSameTenant(session.tenantId, actor);
    return session;
  }

  async triggerAttendance(userId: string, sessionId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.getScopedSession(sessionId, actor);

    return this.prisma.attendanceRecord.upsert({
      where: { userId_sessionId: { userId, sessionId } },
      create: { userId, sessionId, status: 'PRESENT' },
      update: { status: 'PRESENT', markedAt: new Date() },
      include: { session: { select: { title: true, scheduledAt: true } } },
    });
  }

  async markManual(userId: string, sessionId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', actor: Pick<AuthUser, 'role' | 'tenantId'>, notes?: string) {
    await this.getScopedSession(sessionId, actor);
    return this.prisma.attendanceRecord.upsert({
      where: { userId_sessionId: { userId, sessionId } },
      create: { userId, sessionId, status, notes },
      update: { status, notes, markedAt: new Date() },
    });
  }

  async bulkMark(sessionId: string, records: { userId: string; status: string; notes?: string }[], actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.getScopedSession(sessionId, actor);
    const ops = records.map((r) =>
      this.prisma.attendanceRecord.upsert({
        where: { userId_sessionId: { userId: r.userId, sessionId } },
        create: { userId: r.userId, sessionId, status: r.status as any, notes: r.notes },
        update: { status: r.status as any, notes: r.notes },
      }),
    );
    return Promise.all(ops);
  }

  async findBySession(sessionId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    await this.getScopedSession(sessionId, actor);
    return this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async findByStudent(userId: string, actor: AuthUser, courseId?: string) {
    await assertCanAccessStudent(this.prisma, userId, actor);

    const where: any = { userId };
    if (courseId) where.session = { courseId };

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: { session: { select: { id: true, title: true, scheduledAt: true, courseId: true } } },
      orderBy: { markedAt: 'desc' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { records, stats: { total, present, attendanceRate } };
  }

  async getAttendanceStats(tenantId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { tenantId },
      include: { _count: { select: { attendances: true } } },
    });

    const attendances = await this.prisma.attendanceRecord.findMany({
      where: { session: { tenantId } },
    });

    const total = attendances.length;
    const present = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;

    return {
      totalSessions: sessions.length,
      totalAttendanceRecords: total,
      overallAttendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }

  async getStudentsBelowThreshold(tenantId: string, threshold = 80) {
    const students = await this.prisma.user.findMany({
      where: { tenantId, role: 'STUDENT' },
      include: {
        attendances: { include: { session: { select: { tenantId: true } } } },
      },
    });

    return students
      .map((student) => {
        const records = student.attendances;
        const total = records.length;
        const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        return { student: { id: student.id, firstName: student.firstName, lastName: student.lastName, email: student.email }, attendanceRate: rate, total, present };
      })
      .filter((s) => s.attendanceRate < threshold);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, assertSameTenant, assertCanAccessStudent } from '../../common/utils/tenant.util';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getGlobalDashboard() {
    const [totalSchools, totalUsers, totalStudents, totalCourses, totalEnrollments, totalRevenue] =
      await Promise.all([
        this.prisma.tenant.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
        this.prisma.course.count({ where: { isActive: true } }),
        this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
        this.prisma.ledgerEntry.aggregate({ where: { type: 'CREDIT' }, _sum: { amount: true } }),
      ]);

    return {
      totalSchools,
      totalUsers,
      totalStudents,
      totalCourses,
      totalEnrollments,
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    };
  }

  async getBranchDashboard(tenantId: string) {
    const [students, trainers, courses, activeEnrollments, attendanceStats, revenue] =
      await Promise.all([
        this.prisma.user.count({ where: { tenantId, role: 'STUDENT', isActive: true } }),
        this.prisma.user.count({ where: { tenantId, role: 'TRAINER', isActive: true } }),
        this.prisma.course.count({ where: { tenantId, isActive: true } }),
        this.prisma.enrollment.count({
          where: { status: 'ACTIVE', course: { tenantId } },
        }),
        this.prisma.attendanceRecord.groupBy({
          by: ['status'],
          where: { session: { tenantId } },
          _count: { status: true },
        }),
        this.prisma.ledgerEntry.aggregate({
          where: { tenantId, type: 'CREDIT' },
          _sum: { amount: true },
        }),
      ]);

    const totalAttendance = attendanceStats.reduce((a, c) => a + c._count.status, 0);
    const presentCount = attendanceStats.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
    const lateCount = attendanceStats.find((a) => a.status === 'LATE')?._count.status ?? 0;
    const attendanceRate = totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;

    return {
      students,
      trainers,
      courses,
      activeEnrollments,
      attendanceRate,
      totalRevenue: Number(revenue._sum.amount ?? 0),
    };
  }

  async getCourseAnalytics(courseId: string, actor: Pick<AuthUser, 'role' | 'tenantId'>) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { tenantId: true } });
    if (!course) throw new NotFoundException('Course not found');
    assertSameTenant(course.tenantId, actor);

    const [enrollment, assessments, attendance] = await Promise.all([
      this.prisma.enrollment.groupBy({
        by: ['status'],
        where: { courseId },
        _count: { status: true },
      }),
      this.prisma.assessmentSubmission.aggregate({
        where: { assessment: { courseId }, score: { not: null } },
        _avg: { score: true },
        _count: { id: true },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { session: { courseId } },
        _count: { status: true },
      }),
    ]);

    const totalEnrolled = enrollment.reduce((a, c) => a + c._count.status, 0);
    const completed = enrollment.find((e) => e.status === 'COMPLETED')?._count.status ?? 0;
    const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0;

    const totalAtt = attendance.reduce((a, c) => a + c._count.status, 0);
    const presentAtt = (attendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0) +
                       (attendance.find((a) => a.status === 'LATE')?._count.status ?? 0);
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    return {
      totalEnrolled,
      completionRate,
      averageScore: Math.round(assessments._avg.score ?? 0),
      submissionsGraded: assessments._count.id,
      attendanceRate,
      enrollmentByStatus: enrollment,
    };
  }

  async getStudentProgress(userId: string, actor: AuthUser) {
    // A student may only view their own progress; parents only linked children; staff are tenant-scoped.
    await assertCanAccessStudent(this.prisma, userId, actor);

    const [enrollments, submissions, certificates, attendance] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { title: true, duration: true } } },
      }),
      this.prisma.assessmentSubmission.findMany({
        where: { studentId: userId },
        include: { assessment: { select: { title: true, maxScore: true, type: true } } },
      }),
      this.prisma.certificate.count({ where: { userId } }),
      this.prisma.attendanceRecord.findMany({
        where: { userId },
      }),
    ]);

    const totalAtt = attendance.length;
    const presentAtt = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;

    const gradedSubmissions = submissions.filter((s) => s.score !== null);
    const avgScore =
      gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((a, s) => a + (s.score ?? 0), 0) / gradedSubmissions.length)
        : 0;

    return {
      totalCourses: enrollments.length,
      completedCourses: enrollments.filter((e) => e.status === 'COMPLETED').length,
      certificates,
      averageScore: avgScore,
      attendanceRate: totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0,
      enrollments,
    };
  }

  async getRevenueTimeline(tenantId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await this.prisma.ledgerEntry.findMany({
      where: { tenantId, type: 'CREDIT', createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { amount: true, createdAt: true },
    });

    const grouped: Record<string, number> = {};
    entries.forEach((e) => {
      const day = e.createdAt.toISOString().split('T')[0];
      grouped[day] = (grouped[day] ?? 0) + Number(e.amount);
    });

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: string, title: string, body: string, metadata?: object) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, metadata: metadata as any },
    });
  }

  async createBulk(userIds: string[], type: string, title: string, body: string) {
    return this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, title, body })),
    });
  }

  async findByUser(userId: string, onlyUnread = false, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (onlyUnread) where.isRead = false;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, unreadCount, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async markRead(id: string, userId: string) {
    // Scope by userId so a user can only mark their own notifications as read.
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  async notifyTenant(tenantId: string, type: string, title: string, body: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    });
    return this.createBulk(users.map((u) => u.id), type, title, body);
  }

  async sendAttendanceAlert(studentId: string, attendanceRate: number) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { parentRelations: { include: { parent: { select: { id: true } } } } },
    });
    if (!student) return;

    const parentIds = student.parentRelations.map((r) => r.parent.id);
    if (parentIds.length > 0) {
      await this.createBulk(
        parentIds,
        'ATTENDANCE_ALERT',
        'Attendance Alert',
        `${student.firstName} ${student.lastName}'s attendance has dropped to ${attendanceRate}%.`,
      );
    }

    await this.create(
      studentId,
      'ATTENDANCE_ALERT',
      'Low Attendance Warning',
      `Your attendance rate is ${attendanceRate}%. Please attend sessions regularly.`,
    );
  }
}

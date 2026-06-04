import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, isGlobalRole } from '../../common/utils/tenant.util';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ type: [String] }) @IsArray() recipientIds: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiProperty() @IsString() content: string;
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async send(sender: AuthUser, dto: SendMessageDto) {
    const recipientIds = [...new Set(dto.recipientIds)];
    if (recipientIds.length === 0) throw new BadRequestException('At least one recipient is required');

    const recipients = await this.prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, tenantId: true },
    });
    if (recipients.length !== recipientIds.length) {
      throw new BadRequestException('One or more recipients do not exist');
    }
    // Non-global users may only message recipients within their own school.
    if (!isGlobalRole(sender.role) && recipients.some((r) => r.tenantId !== sender.tenantId)) {
      throw new ForbiddenException('You can only message users within your own school');
    }

    return this.prisma.message.create({
      data: {
        senderId: sender.id,
        subject: dto.subject,
        content: dto.content,
        recipients: {
          create: recipientIds.map((userId) => ({ userId })),
        },
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        recipients: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
  }

  async getInbox(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.messageRecipient.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { message: { createdAt: 'desc' } },
        include: {
          message: {
            include: { sender: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.messageRecipient.count({ where: { userId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getSent(senderId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { senderId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          recipients: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        },
      }),
      this.prisma.message.count({ where: { senderId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async markRead(messageId: string, userId: string) {
    return this.prisma.messageRecipient.update({
      where: { messageId_userId: { messageId, userId } },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

import { Injectable } from '@nestjs/common';
import type { Notification, NotificationType, Prisma } from '@prisma/client';

import {
  BaseRepository,
  type PrismaModelDelegate,
} from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class NotificationsRepository extends BaseRepository<Notification> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.notification as unknown as PrismaModelDelegate);
  }

  async findByUserId(
    userId: string,
    options: {
      page: number;
      limit: number;
      type?: NotificationType;
      unreadOnly?: boolean;
    },
  ): Promise<{ items: Notification[]; total: number }> {
    const { page, limit, type, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(type ? { type } : {}),
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' as const },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total };
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      return null;
    }
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }
}

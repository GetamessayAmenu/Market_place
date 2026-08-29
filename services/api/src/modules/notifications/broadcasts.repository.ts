import { Injectable } from '@nestjs/common';
import type { Broadcast, BroadcastAudience, BroadcastStatus, Prisma } from '@prisma/client';
import { BaseRepository, type PrismaModelDelegate } from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class BroadcastsRepository extends BaseRepository<Broadcast> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.broadcast as unknown as PrismaModelDelegate);
  }

  async findBroadcasts(options: {
    page: number;
    limit: number;
    status?: BroadcastStatus | undefined;
    audience?: BroadcastAudience | undefined;
    search?: string | undefined;
  }): Promise<{ items: Broadcast[]; total: number }> {
    const { page, limit, status, audience, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.BroadcastWhereInput = {
      ...(status ? { status } : {}),
      ...(audience ? { audience } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { message: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.broadcast.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.broadcast.count({ where }),
    ]);

    return { items, total };
  }

  async findBroadcastById(id: string): Promise<(Broadcast & { createdBy: { id: string; displayName: string; email: string } }) | null> {
    return this.prisma.broadcast.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });
  }

  async createBroadcast(data: Prisma.BroadcastCreateInput): Promise<Broadcast> {
    return this.prisma.broadcast.create({ data });
  }

  async updateBroadcast(id: string, data: Prisma.BroadcastUpdateInput): Promise<Broadcast> {
    return this.prisma.broadcast.update({
      where: { id },
      data,
    });
  }

  async deleteBroadcast(id: string): Promise<Broadcast> {
    return this.prisma.broadcast.delete({
      where: { id },
    });
  }

  async findDueScheduledBroadcasts(now: Date = new Date()): Promise<Broadcast[]> {
    return this.prisma.broadcast.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now,
        },
      },
    });
  }

  async getBroadcastStats(): Promise<{
    activeBroadcasts: number;
    sentToday: number;
    totalRecipients: number;
    readRate: number;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [activeBroadcasts, sentTodayCount, totalStats] = await Promise.all([
      this.prisma.broadcast.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.broadcast.count({
        where: {
          status: 'SENT',
          sentAt: { gte: todayStart },
        },
      }),
      this.prisma.broadcast.aggregate({
        _sum: {
          totalRecipients: true,
          readCount: true,
        },
      }),
    ]);

    const totalRecipients = totalStats._sum.totalRecipients ?? 0;
    const readCount = totalStats._sum.readCount ?? 0;
    const readRate = totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;

    return {
      activeBroadcasts,
      sentToday: sentTodayCount,
      totalRecipients,
      readRate,
    };
  }

  async createRecipientBatch(recipients: Prisma.BroadcastRecipientCreateManyInput[]): Promise<number> {
    const result = await this.prisma.broadcastRecipient.createMany({
      data: recipients,
      skipDuplicates: true,
    });
    return result.count;
  }

  async updateRecipientReadStatus(broadcastId: string, userId: string): Promise<void> {
    const recipient = await this.prisma.broadcastRecipient.findUnique({
      where: { broadcastId_userId: { broadcastId, userId } },
    });
    if (recipient && !recipient.readAt) {
      await Promise.all([
        this.prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'READ', readAt: new Date() },
        }),
        this.prisma.broadcast.update({
          where: { id: broadcastId },
          data: { readCount: { increment: 1 } },
        }),
      ]);
    }
  }
}

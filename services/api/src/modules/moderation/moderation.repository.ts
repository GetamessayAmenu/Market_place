import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class ModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyWithRelations(params: {
    where?: Prisma.ModerationItemWhereInput;
    orderBy?: Prisma.ModerationItemOrderByWithRelationInput;
    page: number;
    limit: number;
  }) {
    const { where, orderBy, page, limit } = params;
    const skip = (page - 1) * limit;

    const findManyParams: any = {
      skip,
      take: limit,
      include: {
        review: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            seller: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        moderatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        reports: {
          include: {
            reporter: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    };

    if (where) findManyParams.where = where;
    if (orderBy) findManyParams.orderBy = orderBy;

    const countParams: any = {};
    if (where) countParams.where = where;

    const [items, total] = await Promise.all([
      this.prisma.moderationItem.findMany(findManyParams),
      this.prisma.moderationItem.count(countParams),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.moderationItem.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            listing: true,
            reviewer: true,
            seller: true,
          },
        },
        moderatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        reports: {
          include: {
            reporter: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findByIds(ids: string[]) {
    return this.prisma.moderationItem.findMany({
      where: { id: { in: ids } },
    });
  }

  async update(id: string, data: Prisma.ModerationItemUpdateInput) {
    return this.prisma.moderationItem.update({
      where: { id },
      data,
      include: {
        review: {
          include: {
            listing: true,
            reviewer: true,
            seller: true,
          },
        },
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.moderationItem.update({
      where: { id },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string) {
    return this.prisma.moderationItem.update({
      where: { id },
      data: {
        status: 'approved',
        deletedAt: null,
        restoredAt: new Date(),
      },
    });
  }

  async create(data: Prisma.ModerationItemCreateInput) {
    return this.prisma.moderationItem.create({
      data,
      include: {
        review: true,
      },
    });
  }

  async getStats() {
    const [pending, approved, rejected, underReview, deleted, spam] = await Promise.all([
      this.prisma.moderationItem.count({ where: { status: 'pending' } }),
      this.prisma.moderationItem.count({ where: { status: 'approved' } }),
      this.prisma.moderationItem.count({ where: { status: 'rejected' } }),
      this.prisma.moderationItem.count({ where: { status: 'under_review' } }),
      this.prisma.moderationItem.count({ where: { status: 'deleted' } }),
      this.prisma.moderationItem.count({ where: { isSpam: true } }),
    ]);

    return {
      pending,
      approved,
      rejected,
      underReview,
      deleted,
      spam,
      total: pending + approved + rejected + underReview + deleted,
    };
  }

  async findByItemType(itemType: string) {
    return this.prisma.moderationItem.findMany({
      where: { itemType: itemType as any },
      include: {
        review: true,
      },
    });
  }

  async incrementReportCount(id: string) {
    return this.prisma.moderationItem.update({
      where: { id },
      data: {
        reportCount: {
          increment: 1,
        },
      },
    });
  }
}

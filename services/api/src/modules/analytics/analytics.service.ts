import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';

import type { AnalyticsRangeDto } from './dto/analytics-range.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(query: AnalyticsRangeDto) {
    const dateFilter = this.buildDateRange(query);

    const [
      totalUsers,
      totalListings,
      totalReports,
      pendingReports,
      pendingListings,
      totalConversations,
      totalMessages,
      activeListings,
      newUsersInRange,
      newListingsInRange,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.listing.count({ where: { deletedAt: null } }),
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.listing.count({ where: { status: 'pending_review', deletedAt: null } }),
      this.prisma.conversation.count({ where: { deletedAt: null } }),
      this.prisma.message.count({ where: { deletedAt: null } }),
      this.prisma.listing.count({ where: { status: 'active', deletedAt: null } }),
      this.prisma.user.count({
        where: { deletedAt: null, ...(dateFilter ? { createdAt: { gte: dateFilter.from } } : {}) },
      }),
      this.prisma.listing.count({
        where: { deletedAt: null, ...(dateFilter ? { createdAt: { gte: dateFilter.from } } : {}) },
      }),
    ]);

    return {
      users: { total: totalUsers, newInRange: newUsersInRange },
      listings: { total: totalListings, active: activeListings, pending: pendingListings, newInRange: newListingsInRange },
      reports: { total: totalReports, pending: pendingReports },
      messaging: { conversations: totalConversations, messages: totalMessages },
    };
  }

  async getListingsByStatus() {
    const statuses = ['active', 'pending_review', 'rejected', 'sold', 'expired', 'archived', 'draft'] as const;

    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.listing.count({ where: { status, deletedAt: null } }).then((count) => ({ status, count })),
      ),
    );

    return counts.reduce<Record<string, number>>((acc, { status, count }) => {
      acc[status] = count;
      return acc;
    }, {});
  }

  async getUsersByStatus() {
    const statuses = ['active', 'suspended', 'banned', 'pending_verification'] as const;

    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.user.count({ where: { status, deletedAt: null } }).then((count) => ({ status, count })),
      ),
    );

    return counts.reduce<Record<string, number>>((acc, { status, count }) => {
      acc[status] = count;
      return acc;
    }, {});
  }

  async getTopCategories(limit = 10) {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      include: { _count: { select: { listings: true } } },
      orderBy: { listings: { _count: 'desc' } },
      take: limit,
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      listingCount: c._count.listings,
    }));
  }

  private buildDateRange(query: AnalyticsRangeDto): { from: Date; to: Date } | null {
    if (!query.from) return null;
    return {
      from: new Date(query.from),
      to: query.to ? new Date(query.to) : new Date(),
    };
  }
}

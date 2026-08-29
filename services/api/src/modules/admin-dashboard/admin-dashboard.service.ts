import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { DashboardQueryDto, DashboardRange } from './dto/dashboard-query.dto';
import {
  ActivityPointDto,
  CustomOrdersSummaryDto,
  KpiMetricDto,
  ListingSummaryDto,
  ModerationHealthDto,
  NeedsAttentionItemDto,
  NotificationsSummaryDto,
  OrdersSummaryDto,
  OverviewResponseDto,
  RentalsSummaryDto,
  SystemHealthDto,
  UserSellerSummaryDto,
} from './dto/overview-response.dto';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Main Overview aggregation method
   */
  async getOverview(query: DashboardQueryDto, adminUserId?: string): Promise<OverviewResponseDto> {
    const { currentFrom, currentTo, previousFrom, previousTo, rangeLabel } = this.calculateDateRanges(query);

    const [
      kpis,
      needsAttention,
      listings,
      userSeller,
      orders,
      rentals,
      customOrders,
      moderationHealth,
      notificationsSummary,
      systemHealth,
    ] = await Promise.all([
      this.getKpis(currentFrom, currentTo, previousFrom, previousTo, rangeLabel),
      this.getNeedsAttentionItems(),
      this.getListingsSummary(),
      this.getUserSellerSummary(currentFrom, currentTo),
      this.getOrdersSummary(),
      this.getRentalsSummary(),
      this.getCustomOrdersSummary(),
      this.getModerationHealth(currentFrom, currentTo),
      this.getNotificationsSummary(adminUserId, currentFrom, currentTo),
      this.getSystemHealth(),
    ]);

    return {
      range: rangeLabel,
      dateFrom: currentFrom.toISOString(),
      dateTo: currentTo.toISOString(),
      lastUpdated: new Date().toISOString(),
      kpis,
      needsAttention,
      listings,
      userSeller,
      orders,
      rentals,
      customOrders,
      moderationHealth,
      notificationsSummary,
      systemHealth,
    };
  }

  /**
   * Time series daily activity for interactive chart
   */
  async getActivityData(query: DashboardQueryDto): Promise<ActivityPointDto[]> {
    const { currentFrom, currentTo } = this.calculateDateRanges(query);

    // Fetch all raw creation timestamps in range in parallel
    const [users, listings, orders, rentals, customOrders] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: currentFrom, lte: currentTo }, deletedAt: null },
        select: { createdAt: true },
      }),
      this.prisma.listing.findMany({
        where: { createdAt: { gte: currentFrom, lte: currentTo }, deletedAt: null },
        select: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: currentFrom, lte: currentTo } },
        select: { createdAt: true },
      }),
      this.prisma.rentalOrder.findMany({
        where: { createdAt: { gte: currentFrom, lte: currentTo } },
        select: { createdAt: true },
      }),
      this.prisma.customOrder.findMany({
        where: { createdAt: { gte: currentFrom, lte: currentTo } },
        select: { createdAt: true },
      }),
    ]);

    // Build map of day string (YYYY-MM-DD) -> counts
    const dayMap = new Map<string, ActivityPointDto>();

    // Initialize all days in range so chart is complete without missing dates
    const curr = new Date(currentFrom);
    while (curr <= currentTo) {
      const dateKey = curr.toISOString().split('T')[0] || '';
      dayMap.set(dateKey, {
        date: dateKey,
        newUsers: 0,
        newListings: 0,
        orders: 0,
        rentals: 0,
        customOrders: 0,
      });
      curr.setDate(curr.getDate() + 1);
    }

    const increment = (dt: Date | null | undefined, key: keyof Omit<ActivityPointDto, 'date'>) => {
      if (!dt) return;
      const dateKey = new Date(dt).toISOString().split('T')[0] || '';
      const entry = dayMap.get(dateKey);
      if (entry) {
        entry[key] += 1;
      }
    };

    users.forEach((u) => increment(u.createdAt, 'newUsers'));
    listings.forEach((l) => increment(l.createdAt, 'newListings'));
    orders.forEach((o) => increment(o.createdAt, 'orders'));
    rentals.forEach((r) => increment(r.createdAt, 'rentals'));
    customOrders.forEach((co) => increment(co.createdAt, 'customOrders'));

    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * System Health status
   */
  async getSystemHealth(): Promise<SystemHealthDto> {
    const timestamp = new Date().toISOString();

    const [dbHealth, redisHealth] = await Promise.all([
      this.prisma
        .ping()
        .then(() => 'operational' as const)
        .catch(() => 'degraded' as const),
      this.redis
        .pingHealth()
        .then(() => 'operational' as const)
        .catch(() => 'degraded' as const),
    ]);

    return {
      api: 'operational',
      database: dbHealth,
      redis: redisHealth,
      search: 'operational',
      backgroundJobs: 'operational',
      notifications: 'operational',
      timestamp,
    };
  }

  /**
   * Recent Admin Audit Logs
   */
  async getRecentActivity(limit = 10) {
    return this.prisma.adminLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private Aggregation Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private calculateDateRanges(query: DashboardQueryDto) {
    const now = new Date();
    let currentTo = new Date(now);
    let currentFrom = new Date(now);

    const range = query.range || DashboardRange.THIRTY_DAYS;
    let days = 30;
    let rangeLabel = '30 Days';

    if (range === DashboardRange.TODAY) {
      days = 1;
      rangeLabel = 'Today';
    } else if (range === DashboardRange.SEVEN_DAYS) {
      days = 7;
      rangeLabel = '7 Days';
    } else if (range === DashboardRange.NINETY_DAYS) {
      days = 90;
      rangeLabel = '90 Days';
    } else if (range === DashboardRange.CUSTOM && query.from) {
      currentFrom = new Date(query.from);
      currentTo = query.to ? new Date(query.to) : new Date();
      days = Math.max(1, Math.round((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24)));
      rangeLabel = `Custom (${days} days)`;
    }

    if (range !== DashboardRange.CUSTOM || !query.from) {
      currentFrom = new Date(currentTo.getTime() - days * 24 * 60 * 60 * 1000);
    }

    const previousTo = new Date(currentFrom);
    const previousFrom = new Date(previousTo.getTime() - days * 24 * 60 * 60 * 1000);

    return { currentFrom, currentTo, previousFrom, previousTo, rangeLabel };
  }

  private async getKpis(
    currentFrom: Date,
    currentTo: Date,
    previousFrom: Date,
    previousTo: Date,
    rangeLabel: string,
  ) {
    const compLabel = `vs previous period (${rangeLabel})`;

    const [
      totalUsersCurr,
      totalUsersPrev,
      activeSellersCurr,
      activeSellersPrev,
      activeListingsCurr,
      activeListingsPrev,
      ordersCurr,
      ordersPrev,
      rentalsCurr,
      rentalsPrev,
      customOrdersCurr,
      customOrdersPrev,
    ] = await Promise.all([
      // Total Users
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { lte: currentTo } } }),
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { lte: previousTo } } }),
      // Active Sellers
      this.prisma.user.count({
        where: {
          deletedAt: null,
          status: 'active',
          sellerType: { not: null },
          createdAt: { lte: currentTo },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          status: 'active',
          sellerType: { not: null },
          createdAt: { lte: previousTo },
        },
      }),
      // Active Listings
      this.prisma.listing.count({
        where: { deletedAt: null, status: 'active', createdAt: { lte: currentTo } },
      }),
      this.prisma.listing.count({
        where: { deletedAt: null, status: 'active', createdAt: { lte: previousTo } },
      }),
      // Orders in period
      this.prisma.order.count({
        where: { createdAt: { gte: currentFrom, lte: currentTo } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: previousFrom, lte: previousTo } },
      }),
      // Rentals in period
      this.prisma.rentalOrder.count({
        where: { createdAt: { gte: currentFrom, lte: currentTo } },
      }),
      this.prisma.rentalOrder.count({
        where: { createdAt: { gte: previousFrom, lte: previousTo } },
      }),
      // Custom Orders in period
      this.prisma.customOrder.count({
        where: { createdAt: { gte: currentFrom, lte: currentTo } },
      }),
      this.prisma.customOrder.count({
        where: { createdAt: { gte: previousFrom, lte: previousTo } },
      }),
    ]);

    return {
      totalUsers: this.formatKpi(totalUsersCurr, totalUsersPrev, compLabel),
      activeSellers: this.formatKpi(activeSellersCurr, activeSellersPrev, compLabel),
      activeListings: this.formatKpi(activeListingsCurr, activeListingsPrev, compLabel),
      orders: this.formatKpi(ordersCurr, ordersPrev, compLabel),
      rentals: this.formatKpi(rentalsCurr, rentalsPrev, compLabel),
      customOrders: this.formatKpi(customOrdersCurr, customOrdersPrev, compLabel),
    };
  }

  private formatKpi(current: number, previous: number, comparisonLabel: string): KpiMetricDto {
    if (previous === 0) {
      return {
        current,
        previous,
        pctChange: current > 0 ? 100 : 0,
        trend: current > 0 ? 'up' : 'neutral',
        comparisonLabel: current > 0 ? comparisonLabel : 'No comparison data',
      };
    }

    const pctChange = Math.round(((current - previous) / previous) * 1000) / 10;
    const trend = pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'neutral';

    return {
      current,
      previous,
      pctChange,
      trend,
      comparisonLabel,
    };
  }

  private async getNeedsAttentionItems(): Promise<NeedsAttentionItemDto[]> {
    const items: NeedsAttentionItemDto[] = [];

    const [
      pendingListings,
      pendingRevisions,
      openReports,
      pendingChatFlags,
      flaggedConversations,
      pendingVerifications,
      pendingKyc,
      disputedRentals,
      returningRentals,
      pendingCustomOrders,
      openDisputes,
    ] = await Promise.all([
      this.prisma.listing.count({ where: { status: 'pending_review', deletedAt: null } }),
      this.prisma.listingRevision.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.report.count({ where: { status: { in: ['pending', 'under_review', 'investigating'] } } }),
      this.prisma.chatFlagLog.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.conversation.count({ where: { isFlagged: true, deletedAt: null } }),
      this.prisma.verificationRequest.count({ where: { status: 'pending', deletedAt: null } }),
      this.prisma.vendorKycProfile.count({ where: { status: 'PENDING' } }),
      this.prisma.rentalOrder.count({ where: { status: 'DISPUTED' } }),
      this.prisma.rentalOrder.count({ where: { status: { in: ['RETURN_INITIATED', 'RETURNED_PENDING_INSPECTION'] } } }),
      this.prisma.customOrder.count({ where: { status: { in: ['submitted', 'under_review'] } } }),
      this.prisma.dispute.count({ where: { status: { in: ['open', 'escalated', 'under_review', 'in_progress'] } } }),
    ]);

    // 1. Pending Listings & Revisions
    const totalPendingListings = pendingListings + pendingRevisions;
    if (totalPendingListings > 0) {
      items.push({
        key: 'pending_listings',
        title: 'Listings awaiting review',
        count: totalPendingListings,
        severity: 'urgent',
        description: `${pendingListings} new listing(s) and ${pendingRevisions} edit revision(s) require moderation.`,
        category: 'Listings',
        actionUrl: '/listings?status=pending_review',
        actionLabel: 'Review Listings',
      });
    }

    // 2. Open Moderation Reports
    if (openReports > 0) {
      items.push({
        key: 'open_reports',
        title: 'Reports requiring action',
        count: openReports,
        severity: openReports >= 5 ? 'urgent' : 'warning',
        description: `${openReports} open report(s) filed against listings, users, or messages.`,
        category: 'Moderation',
        actionUrl: '/admin/moderation-reports',
        actionLabel: 'View Reports',
      });
    }

    // 3. Open Disputes
    if (openDisputes > 0) {
      items.push({
        key: 'open_disputes',
        title: 'Disputes awaiting resolution',
        count: openDisputes,
        severity: 'urgent',
        description: `${openDisputes} active dispute ticket(s) between buyers and sellers.`,
        category: 'Disputes',
        actionUrl: '/admin/disputes',
        actionLabel: 'Resolve Disputes',
      });
    }

    // 4. Flagged Chats & Security Logs
    const totalChatFlags = pendingChatFlags + flaggedConversations;
    if (totalChatFlags > 0) {
      items.push({
        key: 'flagged_chats',
        title: 'Flagged messages / suspicious activity',
        count: totalChatFlags,
        severity: 'urgent',
        description: `${pendingChatFlags} pending chat review(s) and ${flaggedConversations} flagged conversation(s).`,
        category: 'Safety',
        actionUrl: '/admin/moderation-reports?tab=flags',
        actionLabel: 'Inspect Flags',
      });
    }

    // 5. Pending Seller Verifications & KYC
    const totalVerifications = pendingVerifications + pendingKyc;
    if (totalVerifications > 0) {
      items.push({
        key: 'pending_verifications',
        title: 'Seller verifications & KYC pending',
        count: totalVerifications,
        severity: 'warning',
        description: `${pendingVerifications} seller document(s) and ${pendingKyc} business TIN/KYC application(s) awaiting approval.`,
        category: 'Users',
        actionUrl: '/admin/users-verification',
        actionLabel: 'Verify Sellers',
      });
    }

    // 6. Rental Disputes & Inspections
    const totalRentalIssues = disputedRentals + returningRentals;
    if (totalRentalIssues > 0) {
      items.push({
        key: 'pending_rentals',
        title: 'Rental orders requiring attention',
        count: totalRentalIssues,
        severity: disputedRentals > 0 ? 'urgent' : 'warning',
        description: `${disputedRentals} disputed rental(s) and ${returningRentals} rental item(s) returning for inspection.`,
        category: 'Rentals',
        actionUrl: '/listings?tab=rentals',
        actionLabel: 'Manage Rentals',
      });
    }

    // 7. Custom Orders Awaiting Action
    if (pendingCustomOrders > 0) {
      items.push({
        key: 'pending_custom_orders',
        title: 'New custom order requests',
        count: pendingCustomOrders,
        severity: 'info',
        description: `${pendingCustomOrders} custom tailoring order(s) submitted by buyers awaiting seller quotes/review.`,
        category: 'Custom Orders',
        actionUrl: '/listings?tab=custom_orders',
        actionLabel: 'View Custom Orders',
      });
    }

    // Sort by severity (urgent > warning > info) then count descending
    const severityMap: Record<string, number> = { urgent: 3, warning: 2, info: 1 };
    return items.sort((a, b) => {
      const sevA = severityMap[a.severity] ?? 0;
      const sevB = severityMap[b.severity] ?? 0;
      if (sevA !== sevB) {
        return sevB - sevA;
      }
      return b.count - a.count;
    });
  }

  private async getListingsSummary(): Promise<ListingSummaryDto> {
    const [pending, active, rejected, draft, expired, sold, archived, total] = await Promise.all([
      this.prisma.listing.count({ where: { status: 'pending_review', deletedAt: null } }),
      this.prisma.listing.count({ where: { status: 'active', deletedAt: null } }),
      this.prisma.listing.count({ where: { status: 'rejected', deletedAt: null } }),
      this.prisma.listing.count({ where: { status: 'draft', deletedAt: null } }),
      this.prisma.listing.count({ where: { status: 'expired', deletedAt: null } }),
      this.prisma.listing.count({ where: { status: 'sold', deletedAt: null } }),
      this.prisma.listing.count({ where: { status: 'archived', deletedAt: null } }),
      this.prisma.listing.count({ where: { deletedAt: null } }),
    ]);

    return { pending, active, rejected, draft, expired, sold, archived, total };
  }

  private async getUserSellerSummary(currentFrom: Date, currentTo: Date): Promise<UserSellerSummaryDto> {
    const [
      totalUsers,
      newUsersPeriod,
      activeUsers,
      totalSellers,
      newSellersPeriod,
      activeSellers,
      suspendedUsers,
      pendingVerifications,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: currentFrom, lte: currentTo } } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.user.count({ where: { deletedAt: null, sellerType: { not: null } } }),
      this.prisma.user.count({
        where: { deletedAt: null, sellerType: { not: null }, createdAt: { gte: currentFrom, lte: currentTo } },
      }),
      this.prisma.user.count({ where: { deletedAt: null, sellerType: { not: null }, status: 'active' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: { in: ['suspended', 'banned'] } } }),
      this.prisma.verificationRequest.count({ where: { status: 'pending', deletedAt: null } }),
    ]);

    return {
      totalUsers,
      newUsersPeriod,
      activeUsers,
      totalSellers,
      newSellersPeriod,
      activeSellers,
      suspendedUsers,
      pendingVerifications,
    };
  }

  private async getOrdersSummary(): Promise<OrdersSummaryDto> {
    const [newCount, activeCount, completedCount, cancelledCount, total] = await Promise.all([
      this.prisma.order.count({ where: { status: 'INQUIRY_PENDING' } }),
      this.prisma.order.count({
        where: {
          status: {
            in: [
              'QUOTE_PROPOSED',
              'APPROVED_RESERVED',
              'READY_FOR_HANDOVER',
              'MEASUREMENTS_SUBMITTED',
              'FABRIC_CUTTING',
              'TAILORING_IN_PROGRESS',
              'FITTING_READY',
              'HANDOVER_PENDING_DEPOSIT',
              'RENTAL_ACTIVE',
              'RETURN_INITIATED',
            ],
          },
        },
      }),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.order.count(),
    ]);

    return {
      new: newCount,
      active: activeCount,
      completed: completedCount,
      cancelled: cancelledCount,
      total,
    };
  }

  private async getRentalsSummary(): Promise<RentalsSummaryDto> {
    const [upcoming, active, returningOverdue, completed, disputed, total] = await Promise.all([
      this.prisma.rentalOrder.count({ where: { status: { in: ['REQUESTED', 'APPROVED'] } } }),
      this.prisma.rentalOrder.count({ where: { status: { in: ['HANDOVER_PENDING', 'ACTIVE'] } } }),
      this.prisma.rentalOrder.count({ where: { status: { in: ['RETURN_INITIATED', 'RETURNED_PENDING_INSPECTION'] } } }),
      this.prisma.rentalOrder.count({ where: { status: { in: ['COMPLETED', 'RETURNED_INSPECTED'] } } }),
      this.prisma.rentalOrder.count({ where: { status: 'DISPUTED' } }),
      this.prisma.rentalOrder.count(),
    ]);

    return {
      upcoming,
      active,
      returningOverdue,
      completed,
      disputed,
      total,
    };
  }

  private async getCustomOrdersSummary(): Promise<CustomOrdersSummaryDto> {
    const [newRequests, inProgress, awaitingAction, completed, cancelled, total] = await Promise.all([
      this.prisma.customOrder.count({ where: { status: 'submitted' } }),
      this.prisma.customOrder.count({ where: { status: { in: ['confirmed', 'in_production', 'shipped'] } } }),
      this.prisma.customOrder.count({ where: { status: 'under_review' } }),
      this.prisma.customOrder.count({ where: { status: 'delivered' } }),
      this.prisma.customOrder.count({ where: { status: 'cancelled' } }),
      this.prisma.customOrder.count(),
    ]);

    return {
      newRequests,
      inProgress,
      awaitingAction,
      completed,
      cancelled,
      total,
    };
  }

  private async getModerationHealth(currentFrom: Date, currentTo: Date): Promise<ModerationHealthDto> {
    const [
      openReports,
      flaggedListings,
      reportedUsers,
      suspendedUsers,
      chatFlagsPending,
      recentlyResolvedReports,
    ] = await Promise.all([
      this.prisma.report.count({ where: { status: { in: ['pending', 'under_review', 'investigating'] } } }),
      this.prisma.report.count({ where: { targetType: 'listing', status: { in: ['pending', 'under_review'] } } }),
      this.prisma.report.count({ where: { targetType: 'user', status: { in: ['pending', 'under_review'] } } }),
      this.prisma.user.count({ where: { status: { in: ['suspended', 'banned'] }, deletedAt: null } }),
      this.prisma.chatFlagLog.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.report.count({
        where: {
          status: 'resolved',
          resolvedAt: { gte: currentFrom, lte: currentTo },
        },
      }),
    ]);

    return {
      openReports,
      flaggedListings,
      reportedUsers,
      suspendedUsers,
      chatFlagsPending,
      recentlyResolvedReports,
    };
  }

  private async getNotificationsSummary(
    adminUserId?: string,
    currentFrom?: Date,
    currentTo?: Date,
  ): Promise<NotificationsSummaryDto> {
    const [unreadAdminCount, activeBroadcasts, sentBroadcastsPeriod] = await Promise.all([
      adminUserId
        ? this.prisma.notification.count({ where: { userId: adminUserId, readAt: null } })
        : 0,
      this.prisma.broadcast.count({ where: { status: { in: ['PROCESSING', 'SCHEDULED'] } } }),
      this.prisma.broadcast.count({
        where: {
          status: 'SENT',
          ...(currentFrom && currentTo ? { sentAt: { gte: currentFrom, lte: currentTo } } : {}),
        },
      }),
    ]);

    return {
      unreadAdminCount,
      activeBroadcasts,
      sentBroadcastsPeriod,
    };
  }
}

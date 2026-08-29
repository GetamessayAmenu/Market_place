import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { MessagingRestrictionsService } from './messaging-restrictions.service';
import { RiskSignalService } from './risk-signal.service';

export interface ExtendedChatMetrics {
  totalConversations: number;
  activeConversations: number;
  messagesToday: number;
  messagesThisWeek: number;
  reportedConversations: number;
  reportedMessages: number;
  openReports: number;
  blockedUsers: number;
  flaggedConversations: number;
}

@Injectable()
export class AdminChatsService {
  private readonly HIGH_RISK_THRESHOLD = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly adminLogsService: AdminLogsService,
    private readonly messagingRestrictionsService: MessagingRestrictionsService,
    private readonly riskSignalService: RiskSignalService,
  ) {}

  /**
   * Section 1: Dashboard KPI Cards
   */
  async getMetrics(): Promise<ExtendedChatMetrics> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalConversations,
      activeConversations,
      messagesToday,
      messagesThisWeek,
      reportedConversations,
      reportedMessages,
      openReports,
      blockedUsers,
      flaggedConversations,
    ] = await Promise.all([
      this.prisma.conversation.count({ where: { deletedAt: null } }),
      this.prisma.conversation.count({
        where: {
          deletedAt: null,
          lastMessageAt: { gte: last30Days },
        },
      }),
      this.prisma.message.count({
        where: {
          createdAt: { gte: startOfDay },
          deletedAt: null,
        },
      }),
      this.prisma.message.count({
        where: {
          createdAt: { gte: startOfWeek },
          deletedAt: null,
        },
      }),
      this.prisma.report.count({
        where: {
          targetType: 'conversation',
        },
      }),
      this.prisma.report.count({
        where: {
          targetType: 'message',
        },
      }),
      this.prisma.report.count({
        where: {
          status: { in: ['pending', 'under_review', 'investigating'] },
        },
      }),
      this.prisma.userBlock.count(),
      this.prisma.conversation.count({
        where: {
          OR: [
            { isFlagged: true },
            { riskScore: { gte: this.HIGH_RISK_THRESHOLD } },
          ],
          deletedAt: null,
        },
      }),
    ]);

    return {
      totalConversations,
      activeConversations,
      messagesToday,
      messagesThisWeek,
      reportedConversations,
      reportedMessages,
      openReports,
      blockedUsers,
      flaggedConversations,
    };
  }

  /**
   * Section 1: Dashboard Analytics & Trends
   */
  async getAnalyticsOverview() {
    const now = new Date();
    const past14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const messagesRecent = await this.prisma.message.findMany({
      where: { createdAt: { gte: past14Days }, deletedAt: null },
      select: { createdAt: true },
    });

    const conversationsRecent = await this.prisma.conversation.findMany({
      where: { createdAt: { gte: past14Days }, deletedAt: null },
      select: { createdAt: true },
    });

    const reportsRecent = await this.prisma.report.findMany({
      where: { createdAt: { gte: past14Days } },
      select: { createdAt: true },
    });

    const dailyActivityMap = new Map<string, { messages: number; conversations: number; reports: number }>();
    
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0] ?? '';
      if (key) {
        dailyActivityMap.set(key, { messages: 0, conversations: 0, reports: 0 });
      }
    }

    messagesRecent.forEach(m => {
      const key = m.createdAt.toISOString().split('T')[0];
      if (key && dailyActivityMap.has(key)) {
        dailyActivityMap.get(key)!.messages++;
      }
    });

    conversationsRecent.forEach(c => {
      const key = c.createdAt.toISOString().split('T')[0];
      if (key && dailyActivityMap.has(key)) {
        dailyActivityMap.get(key)!.conversations++;
      }
    });

    reportsRecent.forEach(r => {
      const key = r.createdAt.toISOString().split('T')[0];
      if (key && dailyActivityMap.has(key)) {
        dailyActivityMap.get(key)!.reports++;
      }
    });

    const dailyActivity = Array.from(dailyActivityMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .reverse();

    const topReportedUsers = await this.prisma.report.groupBy({
      by: ['reportedUserId'],
      where: { reportedUserId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const userDetails = await this.prisma.user.findMany({
      where: { id: { in: topReportedUsers.map(u => u.reportedUserId!).filter(Boolean) } },
      select: { id: true, displayName: true, email: true, status: true },
    });

    const mostReportedUsers = topReportedUsers.map(ru => ({
      user: userDetails.find(u => u.id === ru.reportedUserId) || null,
      reportCount: ru._count.id,
    }));

    const topReportedListings = await this.prisma.report.groupBy({
      by: ['listingId'],
      where: { listingId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const listingDetails = await this.prisma.listing.findMany({
      where: { id: { in: topReportedListings.map(l => l.listingId!).filter(Boolean) } },
      select: { id: true, title: true, slug: true, status: true },
    });

    const mostReportedListings = topReportedListings.map(rl => ({
      listing: listingDetails.find(l => l.id === rl.listingId) || null,
      reportCount: rl._count.id,
    }));

    return {
      dailyActivity,
      mostReportedUsers,
      mostReportedListings,
    };
  }

  /**
   * Section 9: Seller Chat Analytics
   */
  async getSellerChatAnalytics(sellerId: string) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, displayName: true, email: true, responseRate: true, responseTimeHours: true },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    const conversations = await this.prisma.conversation.findMany({
      where: { sellerId, deletedAt: null },
      include: {
        messages: {
          take: 2,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const conversationsStarted = conversations.length;
    const buyerInquiries = conversationsStarted;

    let answeredCount = 0;
    let totalResponseTimeMs = 0;

    for (const conv of conversations) {
      if (conv.messages.length >= 2) {
        const firstMsg = conv.messages[0];
        const secondMsg = conv.messages[1];
        if (firstMsg && secondMsg && firstMsg.senderId !== sellerId && secondMsg.senderId === sellerId) {
          answeredCount++;
          const diff = secondMsg.createdAt.getTime() - firstMsg.createdAt.getTime();
          totalResponseTimeMs += diff;
        }
      }
    }

    const unansweredConversations = conversationsStarted - answeredCount;
    const calculatedResponseRate = conversationsStarted > 0 ? Math.round((answeredCount / conversationsStarted) * 100) : 100;
    const avgResponseTimeMinutes = answeredCount > 0 ? Math.round((totalResponseTimeMs / answeredCount) / 60000) : 0;

    const [reportsReceived, blockedCount] = await Promise.all([
      this.prisma.report.count({ where: { reportedUserId: sellerId } }),
      this.prisma.userBlock.count({ where: { blockedUserId: sellerId } }),
    ]);

    const blockRate = conversationsStarted > 0 ? Number(((blockedCount / conversationsStarted) * 100).toFixed(1)) : 0;

    return {
      seller,
      conversationsStarted,
      buyerInquiries,
      responseRate: calculatedResponseRate,
      avgResponseTimeMinutes,
      unansweredConversations,
      reportsReceived,
      blockRate,
    };
  }

  /**
   * Section 10: Listing Chat Analytics
   */
  async getListingChatAnalytics(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true, slug: true, sellerId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const conversations = await this.prisma.conversation.findMany({
      where: { listingId, deletedAt: null },
      select: { buyerId: true, id: true },
    });

    const chatInquiries = conversations.length;
    const uniqueBuyers = new Set(conversations.map(c => c.buyerId)).size;
    const conversationsStarted = chatInquiries;

    const reportsCount = await this.prisma.report.count({
      where: { listingId },
    });

    return {
      listing,
      chatInquiries,
      uniqueBuyers,
      conversationsStarted,
      reportsCount,
    };
  }

  /**
   * Section 8: User Chat Activity (Admin User Details View)
   */
  async getUserChatActivity(userId: string) {
    const riskProfile = await this.riskSignalService.getUserRiskProfile(userId);
    const restrictionsHistory = await this.messagingRestrictionsService.getUserRestrictionsHistory(userId);
    
    const adminLogs = await this.prisma.adminLog.findMany({
      where: { resourceId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentReportedConversations = await this.prisma.report.findMany({
      where: {
        OR: [{ reporterId: userId }, { reportedUserId: userId }],
      },
      include: {
        conversation: {
          select: { id: true, isFlagged: true, riskScore: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      ...riskProfile,
      restrictionsHistory,
      adminLogs,
      recentReportedConversations,
    };
  }

  /**
   * Section 11: Admin Chat Search & Filter
   */
  async searchConversations(query: {
    search?: string;
    conversationId?: string;
    userId?: string;
    listingId?: string;
    isFlagged?: boolean;
    minRiskScore?: number;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.conversationId) where.id = query.conversationId;
    if (query.listingId) where.listingId = query.listingId;
    if (query.userId) {
      where.OR = [{ buyerId: query.userId }, { sellerId: query.userId }];
    }
    if (query.isFlagged !== undefined) where.isFlagged = query.isFlagged;
    if (query.minRiskScore) where.riskScore = { gte: query.minRiskScore };

    if (query.search) {
      where.OR = [
        ...(where.OR || []),
        { buyer: { displayName: { contains: query.search, mode: 'insensitive' } } },
        { seller: { displayName: { contains: query.search, mode: 'insensitive' } } },
        { listing: { title: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ riskScore: 'desc' }, { lastMessageAt: 'desc' }],
        include: {
          buyer: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
          seller: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
          listing: { select: { id: true, title: true, slug: true, status: true } },
          reports: { select: { id: true, reason: true, status: true, priority: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Section 4: Admin Moderation Action - Message Removal
   */
  async removeMessage(messageId: string, adminId: string, reason: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: '[Message removed by moderator due to policy violation]',
      },
    });

    try {
      await this.adminLogsService.createLog({
        actorId: adminId,
        action: 'chat.message_removed',
        resource: 'message',
        resourceId: messageId,
        metadata: {
          conversationId: message.conversationId,
          senderId: message.senderId,
          reason,
        },
      });
    } catch {
      // Non-fatal
    }

    this.eventEmitter.emit('chat.message_removed', {
      messageId,
      conversationId: message.conversationId,
      adminId,
      reason,
    });

    return updated;
  }
}

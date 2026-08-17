import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface FlaggedThread {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string | null;
  isFlagged: boolean;
  riskScore: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
  seller: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
  } | null;
  flagLogs: Array<{
    id: string;
    reason: string;
    keywordTriggered: string | null;
    status: string;
    createdAt: string;
  }>;
}

export interface ThreadMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  metadata: any;
  isFlagged: boolean;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface ChatMetrics {
  totalConversations: number;
  flaggedConversations: number;
  highRiskConversations: number;
  pendingReviews: number;
  resolvedToday: number;
}

@Injectable()
export class AdminChatsService {
  private readonly HIGH_RISK_THRESHOLD = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMetrics(): Promise<ChatMetrics> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalConversations,
      flaggedConversations,
      highRiskConversations,
      pendingReviews,
      resolvedToday,
    ] = await Promise.all([
      this.prisma.conversation.count(),
      this.prisma.conversation.count({ where: { isFlagged: true } }),
      this.prisma.conversation.count({
        where: { riskScore: { gte: this.HIGH_RISK_THRESHOLD } },
      }),
      this.prisma.chatFlagLog.count({
        where: { status: 'PENDING_REVIEW' },
      }),
      this.prisma.chatFlagLog.count({
        where: {
          status: { in: ['RESOLVED', 'DISMISSED', 'USER_BANNED', 'USER_WARNED'] },
          resolvedAt: { gte: startOfDay },
        },
      }),
    ]);

    return {
      totalConversations,
      flaggedConversations,
      highRiskConversations,
      pendingReviews,
      resolvedToday,
    };
  }

  async getFlaggedThreads(
    filter: 'all' | 'flagged' | 'high_risk' | 'resolved' | 'suspended',
    page = 1,
    limit = 20,
  ): Promise<{ threads: FlaggedThread[]; total: number }> {
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    switch (filter) {
      case 'flagged':
        whereClause.isFlagged = true;
        break;
      case 'high_risk':
        whereClause.riskScore = { gte: this.HIGH_RISK_THRESHOLD };
        break;
      case 'resolved':
        whereClause.chatFlagLogs = {
          some: {
            status: { in: ['RESOLVED', 'DISMISSED'] },
          },
        };
        break;
      case 'suspended':
        whereClause.chatFlagLogs = {
          some: {
            status: 'USER_BANNED',
          },
        };
        break;
      default:
        whereClause.OR = [
          { isFlagged: true },
          { riskScore: { gte: this.HIGH_RISK_THRESHOLD } },
        ];
    }

    const [threads, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { riskScore: 'desc' },
          { lastMessageAt: 'desc' },
        ],
        include: {
          buyer: {
            select: {
              id: true,
              displayName: true,
              email: true,
              avatarUrl: true,
            },
          },
          seller: {
            select: {
              id: true,
              displayName: true,
              email: true,
              avatarUrl: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          chatFlagLogs: {
            select: {
              id: true,
              reason: true,
              keywordTriggered: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      this.prisma.conversation.count({ where: whereClause }),
    ]);

    return {
      threads: threads.map((thread) => this.serializeFlaggedThread(thread)),
      total,
    };
  }

  async getThreadMessages(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: ThreadMessage[]; total: number }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      messages: messages.map((msg) => this.serializeThreadMessage(msg)),
      total,
    };
  }

  async resolveFlaggedThread(
    conversationId: string,
    adminId: string,
    action: 'DISMISS' | 'WARN_USER' | 'BAN_USER',
    reason: string,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        chatFlagLogs: {
          where: { status: 'PENDING_REVIEW' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const statusMap = {
      DISMISS: 'DISMISSED',
      WARN_USER: 'USER_WARNED',
      BAN_USER: 'USER_BANNED',
    } as const;

    await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          isFlagged: action === 'DISMISS' ? false : conversation.isFlagged,
          riskScore: action === 'DISMISS' ? 0 : conversation.riskScore,
        },
      }),
      this.prisma.chatFlagLog.updateMany({
        where: {
          id: { in: conversation.chatFlagLogs.map((log) => log.id) },
        },
        data: {
          status: statusMap[action],
          action,
          actionReason: reason,
          resolvedById: adminId,
          resolvedAt: new Date(),
        },
      }),
    ]);

    if (action === 'BAN_USER') {
      await this.prisma.user.updateMany({
        where: {
          id: { in: [conversation.buyerId, conversation.sellerId] },
        },
        data: { status: 'banned' },
      });
    }

    this.eventEmitter.emit('chat.flag_resolved', {
      conversationId,
      adminId,
      action,
      reason,
    });
  }

  private serializeFlaggedThread(thread: any): FlaggedThread {
    return {
      id: thread.id,
      buyerId: thread.buyerId,
      sellerId: thread.sellerId,
      listingId: thread.listingId,
      isFlagged: thread.isFlagged,
      riskScore: thread.riskScore,
      lastMessageAt: thread.lastMessageAt?.toISOString() ?? null,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      buyer: thread.buyer,
      seller: thread.seller,
      listing: thread.listing,
      flagLogs: thread.chatFlagLogs.map((log: any) => ({
        id: log.id,
        reason: log.reason,
        keywordTriggered: log.keywordTriggered,
        status: log.status,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  private serializeThreadMessage(msg: any): ThreadMessage {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      body: msg.body,
      metadata: msg.metadata,
      isFlagged: msg.isFlagged,
      createdAt: msg.createdAt.toISOString(),
      sender: msg.sender,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class DisputesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    skip?: number;
    take?: number;
    status?: string;
    priority?: string;
    type?: string;
    reporterId?: string;
    reportedUserId?: string;
    listingId?: string;
    search?: string;
  }) {
    const { skip = 0, take = 20, status, priority, type, reporterId, reportedUserId, listingId, search } = query;

    const where: Prisma.DisputeWhereInput = {};

    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;
    if (type) where.type = type as any;
    if (reporterId) where.reporterId = reporterId;
    if (reportedUserId) where.reportedUserId = reportedUserId;
    if (listingId) where.listingId = listingId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          reporter: {
            select: { id: true, displayName: true, email: true, avatarUrl: true },
          },
          reportedUser: {
            select: { id: true, displayName: true, email: true, avatarUrl: true },
          },
          listing: {
            select: { id: true, title: true, slug: true, images: { take: 1, where: { isPrimary: true } } },
          },
          conversation: {
            select: { id: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findOne(id: string) {
    return this.prisma.dispute.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, displayName: true, email: true, avatarUrl: true, phone: true },
        },
        reportedUser: {
          select: { id: true, displayName: true, email: true, avatarUrl: true, phone: true },
        },
        listing: {
          select: { id: true, title: true, slug: true, images: true, sellerId: true },
        },
        conversation: {
          select: { id: true, messages: { take: 50, orderBy: { createdAt: 'desc' } } },
        },
        resolvedBy: {
          select: { id: true, displayName: true, email: true },
        },
        escalatedBy: {
          select: { id: true, displayName: true, email: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, displayName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async findByTicketNumber(ticketNumber: string) {
    return this.prisma.dispute.findUnique({
      where: { ticketNumber },
      include: {
        reporter: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
        reportedUser: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async create(data: {
    type: any;
    priority?: any;
    title: string;
    description: string;
    reporterId: string;
    reportedUserId?: string;
    listingId?: string;
    conversationId?: string;
    evidenceUrls?: string[];
    chatEvidenceIds?: string[];
  }) {
    const ticketNumber = await this.generateTicketNumber();

    return this.prisma.dispute.create({
      data: {
        ...data,
        ticketNumber,
        evidenceUrls: data.evidenceUrls || [],
        chatEvidenceIds: data.chatEvidenceIds || [],
      },
      include: {
        reporter: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
        reportedUser: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async update(id: string, data: {
    status?: any;
    priority?: any;
    title?: string;
    description?: string;
    lastActivityAt?: Date;
  }) {
    return this.prisma.dispute.update({
      where: { id },
      data,
      include: {
        reporter: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
        reportedUser: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async resolve(id: string, data: {
    status: any;
    resolutionNote: string;
    resolutionAction: string;
    resolvedById: string;
  }) {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: data.status,
        resolutionNote: data.resolutionNote,
        resolutionAction: data.resolutionAction,
        resolvedById: data.resolvedById,
        resolvedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
  }

  async escalate(id: string, data: {
    status: any;
    escalatedById: string;
    reason?: string;
  }) {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: data.status,
        escalatedById: data.escalatedById,
        escalatedAt: new Date(),
        lastActivityAt: new Date(),
        ...(data.reason !== undefined ? { resolutionNote: data.reason } : {}),
      },
    });
  }

  async close(id: string, _closedById: string) {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
  }

  async createComment(data: {
    disputeId: string;
    authorId: string;
    content: string;
    isInternal?: boolean;
  }) {
    return this.prisma.disputeComment.create({
      data,
      include: {
        author: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async getComments(disputeId: string, includeInternal = false) {
    return this.prisma.disputeComment.findMany({
      where: {
        disputeId,
        ...(includeInternal ? {} : { isInternal: false }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async getStatusCounts() {
    const [open, inProgress, awaitingResponse, underReview, resolved, closed, escalated] = await Promise.all([
      this.prisma.dispute.count({ where: { status: 'open' } }),
      this.prisma.dispute.count({ where: { status: 'in_progress' } }),
      this.prisma.dispute.count({ where: { status: 'awaiting_response' } }),
      this.prisma.dispute.count({ where: { status: 'under_review' } }),
      this.prisma.dispute.count({ where: { status: 'resolved' } }),
      this.prisma.dispute.count({ where: { status: 'closed' } }),
      this.prisma.dispute.count({ where: { status: 'escalated' } }),
    ]);

    return { open, inProgress, awaitingResponse, underReview, resolved, closed, escalated };
  }

  private async generateTicketNumber(): Promise<string> {
    const prefix = 'DSP';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }
}

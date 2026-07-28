import { Injectable } from '@nestjs/common';
import type { Prisma, Report, ReportStatus, ReportTargetType } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

export type ReportWithRelations = Prisma.ReportGetPayload<{
  include: {
    reporter: { select: { id: true; displayName: true; email: true } };
    reportedUser: { select: { id: true; displayName: true; email: true; status: true } };
    listing: { select: { id: true; title: true; slug: true; status: true } };
    message: { select: { id: true; body: true; createdAt: true } };
    resolvedBy: { select: { id: true; displayName: true } };
  };
}>;

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    reporter: { select: { id: true, displayName: true, email: true } },
    reportedUser: { select: { id: true, displayName: true, email: true, status: true } },
    listing: { select: { id: true, title: true, slug: true, status: true } },
    message: { select: { id: true, body: true, createdAt: true } },
    resolvedBy: { select: { id: true, displayName: true } },
  } as const;

  async findById(id: string): Promise<ReportWithRelations | null> {
    return this.prisma.report.findUnique({
      where: { id },
      include: this.include,
    });
  }

  async findDuplicate(
    reporterId: string,
    targetType: ReportTargetType,
    listingId?: string,
    reportedUserId?: string,
    messageId?: string,
  ): Promise<Report | null> {
    return this.prisma.report.findFirst({
      where: {
        reporterId,
        targetType,
        status: { in: ['pending', 'under_review', 'investigating'] },
        ...(listingId ? { listingId } : {}),
        ...(reportedUserId ? { reportedUserId } : {}),
        ...(messageId ? { messageId } : {}),
      },
    });
  }

  async create(data: Prisma.ReportCreateInput): Promise<ReportWithRelations> {
    return this.prisma.report.create({
      data,
      include: this.include,
    });
  }

  async findMany(params: {
    where: Prisma.ReportWhereInput;
    orderBy: Prisma.ReportOrderByWithRelationInput;
    page: number;
    limit: number;
  }): Promise<{ items: ReportWithRelations[]; total: number; page: number; limit: number }> {
    const { where, orderBy, page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: this.include,
      }),
      this.prisma.report.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    resolvedById?: string,
    resolutionNote?: string,
  ): Promise<ReportWithRelations> {
    return this.prisma.report.update({
      where: { id },
      data: {
        status,
        ...(resolvedById ? { resolvedById } : {}),
        ...(status === 'resolved' || status === 'dismissed' ? { resolvedAt: new Date() } : {}),
        ...(resolutionNote ? { resolutionNote } : {}),
      },
      include: this.include,
    });
  }

  async closeReport(id: string, note?: string): Promise<ReportWithRelations> {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: 'closed' as any,
        closedAt: new Date() as any,
        ...(note ? { resolutionNote: note } : {}),
      },
      include: this.include,
    }) as any;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const [pending, underReview, investigating, resolved, dismissed, closed] = await Promise.all([
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({ where: { status: 'under_review' } }),
      this.prisma.report.count({ where: { status: 'investigating' as any } }),
      this.prisma.report.count({ where: { status: 'resolved' } }),
      this.prisma.report.count({ where: { status: 'dismissed' } }),
      this.prisma.report.count({ where: { status: 'closed' as any } }),
    ]);
    return { pending, under_review: underReview, investigating, resolved, dismissed, closed };
  }

  async getConversationMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, displayName: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

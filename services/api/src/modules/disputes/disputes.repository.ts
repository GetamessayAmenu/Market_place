import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class DisputesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    displayName: true,
    email: true,
    avatarUrl: true,
    phone: true,
    status: true,
    createdAt: true,
  };

  async findAll(query: {
    skip?: number | undefined;
    take?: number | undefined;
    status?: string | undefined;
    priority?: string | undefined;
    type?: string | undefined;
    categoryId?: string | undefined;
    assignedAdminId?: string | undefined;
    reporterId?: string | undefined;
    reportedUserId?: string | undefined;
    listingId?: string | undefined;
    orderId?: string | undefined;
    rentalId?: string | undefined;
    customOrderId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    search?: string | undefined;
  }) {
    const {
      skip = 0,
      take = 20,
      status,
      priority,
      type,
      categoryId,
      assignedAdminId,
      reporterId,
      reportedUserId,
      listingId,
      orderId,
      rentalId,
      customOrderId,
      startDate,
      endDate,
      search,
    } = query;

    const where: Prisma.DisputeWhereInput = {};

    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;
    if (type) where.type = type as any;
    if (categoryId) where.categoryId = categoryId;
    if (assignedAdminId) where.assignedAdminId = assignedAdminId;
    if (reporterId) where.reporterId = reporterId;
    if (reportedUserId) where.reportedUserId = reportedUserId;
    if (listingId) where.listingId = listingId;
    if (orderId) where.orderId = orderId;
    if (rentalId) where.rentalId = rentalId;
    if (customOrderId) where.customOrderId = customOrderId;

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { reporter: { displayName: { contains: search, mode: 'insensitive' } } },
        { reportedUser: { displayName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          reporter: { select: this.userSelect },
          reportedUser: { select: this.userSelect },
          assignedAdmin: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
          category: true,
          listing: {
            select: { id: true, title: true, slug: true, price: true, images: { take: 1, where: { isPrimary: true } } },
          },
          order: {
            select: { id: true, orderNumber: true, type: true, status: true, agreedPrice: true },
          },
          rental: {
            select: { id: true, orderNumber: true, status: true, startDate: true, endDate: true, totalAmount: true },
          },
          customOrder: {
            select: { id: true, status: true, agreedPrice: true },
          },
          _count: {
            select: { comments: true, evidence: true },
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
          select: {
            ...this.userSelect,
            _count: { select: { disputesReported: true, reportsFiled: true } },
          },
        },
        reportedUser: {
          select: {
            ...this.userSelect,
            _count: { select: { disputesAgainst: true, reportsAgainst: true } },
          },
        },
        assignedAdmin: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        resolvedBy: { select: { id: true, displayName: true, email: true } },
        escalatedBy: { select: { id: true, displayName: true, email: true } },
        reopenedBy: { select: { id: true, displayName: true, email: true } },
        category: true,
        listing: {
          select: { id: true, title: true, slug: true, price: true, currency: true, condition: true, images: true, sellerId: true },
        },
        order: {
          select: { id: true, orderNumber: true, type: true, status: true, agreedPrice: true, createdAt: true },
        },
        rental: {
          select: { id: true, orderNumber: true, status: true, startDate: true, endDate: true, dailyRate: true, totalAmount: true, securityDeposit: true },
        },
        customOrder: {
          select: { id: true, status: true, agreedPrice: true, selectedSize: true, selectedColor: true, selectedFabric: true, buyerNotes: true },
        },
        conversation: {
          select: {
            id: true,
            messages: {
              take: 50,
              orderBy: { createdAt: 'desc' },
              include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
            },
          },
        },
        report: { select: { id: true, reason: true, targetType: true, status: true, createdAt: true } },
        evidence: {
          orderBy: { createdAt: 'desc' },
          include: { uploader: { select: { id: true, displayName: true, email: true } } },
        },
        history: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { id: true, displayName: true, email: true, avatarUrl: true } } },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async findByTicketNumber(ticketNumber: string) {
    return this.prisma.dispute.findUnique({
      where: { ticketNumber },
      include: {
        reporter: { select: this.userSelect },
        reportedUser: { select: this.userSelect },
        category: true,
      },
    });
  }

  async findActiveDuplicate(params: {
    reporterId: string;
    listingId?: string | undefined;
    orderId?: string | undefined;
    rentalId?: string | undefined;
    customOrderId?: string | undefined;
  }) {
    const activeStatuses: any[] = ['open', 'in_progress', 'under_review', 'waiting_for_info', 'waiting_for_information', 'escalated'];
    const { reporterId, listingId, orderId, rentalId, customOrderId } = params;

    const conditions: Prisma.DisputeWhereInput[] = [];

    if (orderId) conditions.push({ orderId });
    if (rentalId) conditions.push({ rentalId });
    if (customOrderId) conditions.push({ customOrderId });
    if (listingId && !orderId && !rentalId && !customOrderId) conditions.push({ listingId, reporterId });

    if (conditions.length === 0) return null;

    return this.prisma.dispute.findFirst({
      where: {
        reporterId,
        status: { in: activeStatuses },
        OR: conditions,
      },
    });
  }

  async create(data: {
    type?: any;
    priority?: any;
    title: string;
    description: string;
    reporterId: string;
    reportedUserId?: string | undefined;
    listingId?: string | undefined;
    orderId?: string | undefined;
    rentalId?: string | undefined;
    customOrderId?: string | undefined;
    conversationId?: string | undefined;
    reportId?: string | undefined;
    categoryId?: string | undefined;
    evidenceUrls?: string[] | undefined;
    chatEvidenceIds?: string[] | undefined;
    evidence?: Array<{ fileUrl: string; fileName?: string | undefined; fileType?: string | undefined; fileSize?: number | undefined; cloudinaryPublicId?: string | undefined }> | undefined;
  }) {
    const ticketNumber = await this.generateTicketNumber();
    const fallbackType = data.type || 'other';

    const dispute = await this.prisma.dispute.create({
      data: {
        ticketNumber,
        type: fallbackType,
        priority: data.priority || 'medium',
        status: 'open',
        title: data.title,
        description: data.description,
        reporterId: data.reporterId,
        reportedUserId: data.reportedUserId || null,
        listingId: data.listingId || null,
        orderId: data.orderId || null,
        rentalId: data.rentalId || null,
        customOrderId: data.customOrderId || null,
        conversationId: data.conversationId || null,
        reportId: data.reportId || null,
        categoryId: data.categoryId || null,
        evidenceUrls: data.evidenceUrls || [],
        chatEvidenceIds: data.chatEvidenceIds || [],
        lastActivityAt: new Date(),
      },
      include: {
        reporter: { select: this.userSelect },
        reportedUser: { select: this.userSelect },
        category: true,
      },
    });

    if (data.evidence && data.evidence.length > 0) {
      await this.prisma.disputeEvidence.createMany({
        data: data.evidence.map((item) => ({
          disputeId: dispute.id,
          uploaderId: data.reporterId,
          fileUrl: item.fileUrl,
          fileName: item.fileName || null,
          fileType: item.fileType || null,
          fileSize: item.fileSize || null,
          cloudinaryPublicId: item.cloudinaryPublicId || null,
        })),
      });
    }

    await this.prisma.disputeHistory.create({
      data: {
        disputeId: dispute.id,
        actorId: data.reporterId,
        action: 'CREATED',
        toState: { status: 'open', priority: dispute.priority, ticketNumber },
        note: `Dispute ${ticketNumber} created by reporter.`,
      },
    });

    return dispute;
  }

  async addEvidence(data: {
    disputeId: string;
    uploaderId: string;
    fileUrl: string;
    fileName?: string | undefined;
    fileType?: string | undefined;
    fileSize?: number | undefined;
    cloudinaryPublicId?: string | undefined;
    metadata?: any;
  }) {
    const evidence = await this.prisma.disputeEvidence.create({
      data: {
        disputeId: data.disputeId,
        uploaderId: data.uploaderId,
        fileUrl: data.fileUrl,
        fileName: data.fileName || null,
        fileType: data.fileType || null,
        fileSize: data.fileSize || null,
        cloudinaryPublicId: data.cloudinaryPublicId || null,
        metadata: data.metadata || null,
      },
      include: {
        uploader: { select: { id: true, displayName: true, email: true } },
      },
    });

    await this.prisma.dispute.update({
      where: { id: data.disputeId },
      data: {
        lastActivityAt: new Date(),
        evidenceUrls: { push: data.fileUrl },
      },
    });

    await this.addHistory({
      disputeId: data.disputeId,
      actorId: data.uploaderId,
      action: 'EVIDENCE_ADDED',
      note: `Added evidence file ${data.fileName || data.fileUrl}`,
    });

    return evidence;
  }

  async addHistory(data: {
    disputeId: string;
    actorId: string;
    action: string;
    fromState?: any;
    toState?: any;
    note?: string | undefined;
  }) {
    return this.prisma.disputeHistory.create({
      data: {
        disputeId: data.disputeId,
        actorId: data.actorId,
        action: data.action,
        fromState: data.fromState || null,
        toState: data.toState || null,
        note: data.note || null,
      },
    });
  }

  async update(id: string, data: {
    status?: any;
    priority?: any;
    categoryId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    lastActivityAt?: Date | undefined;
  }) {
    const updateData: Prisma.DisputeUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.lastActivityAt !== undefined) updateData.lastActivityAt = data.lastActivityAt;

    return this.prisma.dispute.update({
      where: { id },
      data: updateData,
      include: {
        reporter: { select: this.userSelect },
        reportedUser: { select: this.userSelect },
        assignedAdmin: { select: { id: true, displayName: true, email: true } },
        category: true,
      },
    });
  }

  async assignAdmin(id: string, adminId: string | null, actorId: string) {
    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        assignedAdminId: adminId,
        lastActivityAt: new Date(),
      },
      include: {
        assignedAdmin: { select: { id: true, displayName: true, email: true } },
      },
    });

    await this.addHistory({
      disputeId: id,
      actorId,
      action: 'ADMIN_ASSIGNED',
      toState: { assignedAdminId: adminId },
      note: adminId ? `Assigned admin ${updated.assignedAdmin?.displayName || adminId}` : 'Unassigned admin',
    });

    return updated;
  }

  async resolve(id: string, data: {
    status: any;
    resolutionOutcome: string;
    resolutionReason: string;
    resolutionNote?: string | undefined;
    resolutionAction?: string | undefined;
    resolvedById: string;
  }) {
    const updateData: Prisma.DisputeUpdateInput = {
      status: data.status,
      resolutionOutcome: data.resolutionOutcome,
      resolutionReason: data.resolutionReason,
      resolutionNote: data.resolutionNote || data.resolutionReason,
      resolvedBy: { connect: { id: data.resolvedById } },
      resolvedAt: new Date(),
      lastActivityAt: new Date(),
    };

    if (data.resolutionAction) {
      updateData.resolutionAction = data.resolutionAction;
    }

    const resolved = await this.prisma.dispute.update({
      where: { id },
      data: updateData,
      include: {
        reporter: { select: this.userSelect },
        reportedUser: { select: this.userSelect },
      },
    });

    await this.addHistory({
      disputeId: id,
      actorId: data.resolvedById,
      action: 'RESOLVED',
      toState: { status: data.status, outcome: data.resolutionOutcome, reason: data.resolutionReason },
      note: `Resolved dispute with decision: ${data.resolutionOutcome}. Reason: ${data.resolutionReason}`,
    });

    return resolved;
  }

  async escalate(id: string, data: {
    status: any;
    escalatedById: string;
    reason?: string | undefined;
  }) {
    const updateData: Prisma.DisputeUpdateInput = {
      status: data.status,
      escalatedBy: { connect: { id: data.escalatedById } },
      escalatedAt: new Date(),
      lastActivityAt: new Date(),
    };

    if (data.reason !== undefined) {
      updateData.resolutionNote = data.reason;
    }

    const escalated = await this.prisma.dispute.update({
      where: { id },
      data: updateData,
    });

    await this.addHistory({
      disputeId: id,
      actorId: data.escalatedById,
      action: 'ESCALATED',
      toState: { status: data.status },
      note: data.reason ? `Escalated dispute: ${data.reason}` : 'Dispute escalated to higher admin tier.',
    });

    return escalated;
  }

  async close(id: string, actorId: string) {
    const closed = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    await this.addHistory({
      disputeId: id,
      actorId,
      action: 'CLOSED',
      toState: { status: 'closed' },
      note: 'Dispute closed.',
    });

    return closed;
  }

  async reopen(id: string, actorId: string, reason: string) {
    const reopened = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: 'open',
        reopenedBy: { connect: { id: actorId } },
        reopenedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    await this.addHistory({
      disputeId: id,
      actorId,
      action: 'REOPENED',
      toState: { status: 'open' },
      note: `Dispute reopened: ${reason}`,
    });

    return reopened;
  }

  async createComment(data: {
    disputeId: string;
    authorId: string;
    content: string;
    isInternal?: boolean | undefined;
  }) {
    const commentData: Prisma.DisputeCommentCreateInput = {
      dispute: { connect: { id: data.disputeId } },
      author: { connect: { id: data.authorId } },
      content: data.content,
      isInternal: data.isInternal ?? false,
    };

    const comment = await this.prisma.disputeComment.create({
      data: commentData,
      include: {
        author: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      },
    });

    await this.prisma.dispute.update({
      where: { id: data.disputeId },
      data: { lastActivityAt: new Date() },
    });

    await this.addHistory({
      disputeId: data.disputeId,
      actorId: data.authorId,
      action: data.isInternal ? 'NOTE_ADDED' : 'COMMUNICATION_ADDED',
      note: data.isInternal ? 'Added internal admin note.' : 'Sent message/response in dispute thread.',
    });

    return comment;
  }

  async getComments(disputeId: string, includeInternal = false) {
    return this.prisma.disputeComment.findMany({
      where: {
        disputeId,
        ...(includeInternal ? {} : { isInternal: false }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      },
    });
  }

  async getDashboardStats() {
    const [
      total,
      open,
      underReview,
      waitingForInfo,
      escalated,
      resolved,
      closed,
      highPriority,
      categories,
      repeatOffenders,
      resolvedDisputes,
    ] = await Promise.all([
      this.prisma.dispute.count(),
      this.prisma.dispute.count({ where: { status: 'open' } }),
      this.prisma.dispute.count({ where: { status: 'under_review' } }),
      this.prisma.dispute.count({
        where: {
          status: { in: ['waiting_for_info', 'waiting_for_information', 'awaiting_response'] },
        },
      }),
      this.prisma.dispute.count({ where: { status: 'escalated' } }),
      this.prisma.dispute.count({ where: { status: 'resolved' } }),
      this.prisma.dispute.count({ where: { status: 'closed' } }),
      this.prisma.dispute.count({
        where: {
          priority: { in: ['high', 'urgent'] },
          status: { notIn: ['resolved', 'closed'] },
        },
      }),
      this.prisma.disputeCategory.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { disputes: true } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.dispute.groupBy({
        by: ['reportedUserId'],
        where: { reportedUserId: { not: null } },
        _count: { id: true },
        having: { id: { _count: { gt: 1 } } },
      }),
      this.prisma.dispute.findMany({
        where: { status: 'resolved', resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

    let avgResolutionHours = 0;
    if (resolvedDisputes.length > 0) {
      const totalHours = resolvedDisputes.reduce((acc, curr) => {
        if (!curr.resolvedAt) return acc;
        const diffMs = curr.resolvedAt.getTime() - curr.createdAt.getTime();
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedDisputes.length) * 10) / 10;
    }

    return {
      total,
      open,
      underReview,
      waitingForInfo,
      escalated,
      resolved,
      closed,
      highPriority,
      avgResolutionHours,
      repeatOffendersCount: repeatOffenders.length,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c._count.disputes,
      })),
    };
  }

  // ── Dispute Categories Methods ─────────────────────────────────

  async findAllCategories() {
    return this.prisma.disputeCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findCategoryById(id: string) {
    return this.prisma.disputeCategory.findUnique({ where: { id } });
  }

  async findCategoryBySlug(slug: string) {
    return this.prisma.disputeCategory.findUnique({ where: { slug } });
  }

  async createCategory(data: {
    name: string;
    nameAm?: string | undefined;
    slug: string;
    description?: string | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
  }) {
    const createData: Prisma.DisputeCategoryCreateInput = {
      name: data.name,
      slug: data.slug,
      ...(data.nameAm !== undefined ? { nameAm: data.nameAm } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };
    return this.prisma.disputeCategory.create({ data: createData });
  }

  async updateCategory(id: string, data: {
    name?: string | undefined;
    nameAm?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
  }) {
    const updateData: Prisma.DisputeCategoryUpdateInput = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.nameAm !== undefined ? { nameAm: data.nameAm } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };
    return this.prisma.disputeCategory.update({ where: { id }, data: updateData });
  }

  async deleteCategory(id: string) {
    return this.prisma.disputeCategory.delete({ where: { id } });
  }

  private async generateTicketNumber(): Promise<string> {
    const prefix = 'DISP';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9000 + 1000).toString();
    return `${prefix}-${dateStr}-${random}`;
  }
}

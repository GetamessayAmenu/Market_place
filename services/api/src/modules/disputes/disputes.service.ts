import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DisputesRepository } from './disputes.repository';
import type { CreateDisputeCommentDto } from './dto/create-dispute-comment.dto';
import type { CreateDisputeDto } from './dto/create-dispute.dto';
import type { CreateDisputeCategoryDto, UpdateDisputeCategoryDto } from './dto/dispute-category.dto';
import type { DisputeQueryDto } from './dto/dispute-query.dto';
import type { AssignDisputeDto, EscalateDisputeDto, ReopenDisputeDto, RequestInfoDisputeDto, ResolveDisputeDto } from './dto/resolve-dispute.dto';
import type { UpdateDisputeDto } from './dto/update-dispute.dto';
import type { TakeDisputeActionDto } from './dto/dispute-action.dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly repository: DisputesRepository,
    private readonly prisma: PrismaService,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: DisputeQueryDto) {
    return this.repository.findAll(query);
  }

  async findMine(user: AuthenticatedUser, query: DisputeQueryDto) {
    return this.repository.findAll({
      ...query,
      reporterId: user.id,
    });
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const dispute = await this.repository.findOne(id);
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const isAdmin = this.isUserAdmin(user);
    const isParticipant = dispute.reporterId === user.id || dispute.reportedUserId === user.id;

    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('You are not authorized to view this dispute');
    }

    return dispute;
  }

  async findByTicketNumber(ticketNumber: string) {
    const dispute = await this.repository.findByTicketNumber(ticketNumber);
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return dispute;
  }

  async create(user: AuthenticatedUser, dto: CreateDisputeDto) {
    // 1. Check for existing active duplicate dispute
    const existing = await this.repository.findActiveDuplicate({
      reporterId: user.id,
      listingId: dto.listingId || undefined,
      orderId: dto.orderId || undefined,
      rentalId: dto.rentalId || undefined,
      customOrderId: dto.customOrderId || undefined,
    });

    if (existing) {
      throw new ConflictException(
        `An active dispute (${existing.ticketNumber}) already exists for this item/transaction.`
      );
    }

    // 2. Resolve target reportedUserId if not explicitly passed
    let reportedUserId = dto.reportedUserId;
    if (!reportedUserId) {
      if (dto.listingId) {
        const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
        if (listing && listing.sellerId !== user.id) reportedUserId = listing.sellerId;
      } else if (dto.orderId) {
        const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
        if (order) reportedUserId = order.buyerId === user.id ? order.sellerId : order.buyerId;
      } else if (dto.rentalId) {
        const rental = await this.prisma.rentalOrder.findUnique({ where: { id: dto.rentalId } });
        if (rental) reportedUserId = rental.renterId === user.id ? rental.sellerId : rental.renterId;
      } else if (dto.customOrderId) {
        const customOrder = await this.prisma.customOrder.findUnique({ where: { id: dto.customOrderId } });
        if (customOrder) reportedUserId = customOrder.buyerId === user.id ? customOrder.sellerId : customOrder.buyerId;
      }
    }

    // 3. Resolve category ID if categorySlug is provided
    let categoryId = dto.categoryId;
    if (!categoryId && dto.categorySlug) {
      const category = await this.repository.findCategoryBySlug(dto.categorySlug);
      if (category) categoryId = category.id;
    }

    // 4. Create dispute
    const dispute = await this.repository.create({
      ...dto,
      reporterId: user.id,
      reportedUserId: reportedUserId || undefined,
      categoryId: categoryId || undefined,
      listingId: dto.listingId || undefined,
      orderId: dto.orderId || undefined,
      rentalId: dto.rentalId || undefined,
      customOrderId: dto.customOrderId || undefined,
      conversationId: dto.conversationId || undefined,
      reportId: dto.reportId || undefined,
      evidenceUrls: dto.evidenceUrls || undefined,
      chatEvidenceIds: dto.chatEvidenceIds || undefined,
      evidence: dto.evidence || undefined,
    });

    // 5. Create audit log
    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'create_dispute',
      resource: 'dispute',
      resourceId: dispute.id,
      metadata: { ticketNumber: dispute.ticketNumber, title: dispute.title },
    });

    // 6. Notify reporter & respondent
    await this.notificationsService.createCustomNotification(
      user.id,
      'system',
      'Dispute Submitted',
      `Your dispute ${dispute.ticketNumber} has been successfully submitted and is under review.`,
      { disputeId: dispute.id, ticketNumber: dispute.ticketNumber }
    );

    if (reportedUserId) {
      await this.notificationsService.createCustomNotification(
        reportedUserId,
        'system',
        'Dispute Filed',
        `A dispute (${dispute.ticketNumber}) has been filed regarding a recent transaction.`,
        { disputeId: dispute.id, ticketNumber: dispute.ticketNumber }
      );
    }

    return dispute;
  }

  async addEvidence(user: AuthenticatedUser, disputeId: string, evidenceData: {
    fileUrl: string;
    fileName?: string | undefined;
    fileType?: string | undefined;
    fileSize?: number | undefined;
    cloudinaryPublicId?: string | undefined;
  }) {
    await this.findOne(user, disputeId);

    const evidence = await this.repository.addEvidence({
      disputeId,
      uploaderId: user.id,
      ...evidenceData,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'add_dispute_evidence',
      resource: 'dispute',
      resourceId: disputeId,
      metadata: { fileName: evidenceData.fileName || evidenceData.fileUrl },
    });

    return evidence;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateDisputeDto) {
    await this.findOne(user, id);

    const updated = await this.repository.update(id, {
      ...dto,
      lastActivityAt: new Date(),
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'update_dispute',
      resource: 'dispute',
      resourceId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async assignAdmin(user: AuthenticatedUser, id: string, dto: AssignDisputeDto) {
    await this.findOne(user, id);

    const updated = await this.repository.assignAdmin(id, dto.assignedAdminId ?? null, user.id);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'assign_dispute_admin',
      resource: 'dispute',
      resourceId: id,
      metadata: { assignedAdminId: dto.assignedAdminId },
    });

    if (dto.assignedAdminId) {
      await this.notificationsService.createCustomNotification(
        dto.assignedAdminId,
        'system',
        'Dispute Assigned',
        `Dispute ${updated.ticketNumber} has been assigned to you.`,
        { disputeId: id, ticketNumber: updated.ticketNumber }
      );
    }

    return updated;
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: string) {
    const dispute = await this.findOne(user, id);

    const updated = await this.repository.update(id, {
      status: status as any,
      lastActivityAt: new Date(),
    });

    await this.repository.addHistory({
      disputeId: id,
      actorId: user.id,
      action: 'STATUS_CHANGED',
      fromState: { status: dispute.status },
      toState: { status },
      note: `Status updated from ${dispute.status} to ${status}`,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'update_dispute_status',
      resource: 'dispute',
      resourceId: id,
      metadata: { previousStatus: dispute.status, newStatus: status },
    });

    await this.notifyParties(dispute, 'Dispute Status Updated', `Status changed to ${status.replace(/_/g, ' ')}`);

    return updated;
  }

  async requestInformation(user: AuthenticatedUser, id: string, dto: RequestInfoDisputeDto) {
    const dispute = await this.findOne(user, id);

    await this.repository.update(id, {
      status: 'waiting_for_info',
      lastActivityAt: new Date(),
    });

    await this.repository.createComment({
      disputeId: id,
      authorId: user.id,
      content: `[Information Requested from ${dto.targetUser.toUpperCase()}]: ${dto.message}`,
      isInternal: false,
    });

    await this.repository.addHistory({
      disputeId: id,
      actorId: user.id,
      action: 'INFO_REQUESTED',
      toState: { targetUser: dto.targetUser },
      note: `Requested information from ${dto.targetUser}: ${dto.message}`,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'request_dispute_info',
      resource: 'dispute',
      resourceId: id,
      metadata: { targetUser: dto.targetUser, message: dto.message },
    });

    if (dto.targetUser === 'reporter' || dto.targetUser === 'both') {
      await this.notificationsService.createCustomNotification(
        dispute.reporterId,
        'system',
        'Action Required: Dispute Information Requested',
        `An admin has requested additional information for dispute ${dispute.ticketNumber}.`,
        { disputeId: id, ticketNumber: dispute.ticketNumber }
      );
    }

    if ((dto.targetUser === 'respondent' || dto.targetUser === 'both') && dispute.reportedUserId) {
      await this.notificationsService.createCustomNotification(
        dispute.reportedUserId,
        'system',
        'Action Required: Dispute Information Requested',
        `An admin has requested additional information for dispute ${dispute.ticketNumber}.`,
        { disputeId: id, ticketNumber: dispute.ticketNumber }
      );
    }

    return { success: true, status: 'waiting_for_info' };
  }

  async resolve(user: AuthenticatedUser, id: string, dto: ResolveDisputeDto) {
    const dispute = await this.findOne(user, id);

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new BadRequestException('Dispute is already resolved or closed');
    }

    const resolved = await this.repository.resolve(id, {
      status: 'resolved',
      resolutionOutcome: dto.resolutionOutcome,
      resolutionReason: dto.resolutionReason,
      resolutionNote: dto.resolutionNote || undefined,
      resolutionAction: dto.resolutionAction || undefined,
      resolvedById: user.id,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'resolve_dispute',
      resource: 'dispute',
      resourceId: id,
      metadata: { outcome: dto.resolutionOutcome, reason: dto.resolutionReason },
    });

    await this.notifyParties(
      dispute,
      'Dispute Resolved',
      `Dispute ${dispute.ticketNumber} has been resolved. Decision: ${dto.resolutionOutcome.replace(/_/g, ' ')}.`
    );

    return resolved;
  }

  async escalate(user: AuthenticatedUser, id: string, dto: EscalateDisputeDto) {
    const dispute = await this.findOne(user, id);

    if (dispute.status === 'escalated') {
      throw new BadRequestException('Dispute is already escalated');
    }

    const escalated = await this.repository.escalate(id, {
      status: 'escalated',
      escalatedById: user.id,
      reason: dto.reason || undefined,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'escalate_dispute',
      resource: 'dispute',
      resourceId: id,
      metadata: { reason: dto.reason },
    });

    return escalated;
  }

  async close(user: AuthenticatedUser, id: string) {
    await this.findOne(user, id);

    const closed = await this.repository.close(id, user.id);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'close_dispute',
      resource: 'dispute',
      resourceId: id,
    });

    return closed;
  }

  async reopen(user: AuthenticatedUser, id: string, dto: ReopenDisputeDto) {
    const dispute = await this.findOne(user, id);

    if (dispute.status !== 'resolved' && dispute.status !== 'closed') {
      throw new BadRequestException('Only resolved or closed disputes can be reopened.');
    }

    const reopened = await this.repository.reopen(id, user.id, dto.reason);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'reopen_dispute',
      resource: 'dispute',
      resourceId: id,
      metadata: { reason: dto.reason },
    });

    await this.notifyParties(
      dispute,
      'Dispute Reopened',
      `Dispute ${dispute.ticketNumber} has been reopened for further investigation.`
    );

    return reopened;
  }

  async takeAction(user: AuthenticatedUser, id: string, dto: TakeDisputeActionDto) {
    const dispute = await this.findOne(user, id);

    const targetUserId = dto.targetUserId || dispute.reportedUserId;
    if (!targetUserId && (dto.action.includes('user') || dto.action.includes('suspend'))) {
      throw new BadRequestException('Target user is required for user moderation actions');
    }

    if (dto.action === 'suspend_user' && targetUserId) {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: { status: 'suspended' },
      });

      await this.notificationsService.createModerationActionNotification(
        targetUserId,
        'Account Suspended',
        `Account suspended via Dispute ${dispute.ticketNumber}. Reason: ${dto.reason}`
      );
    } else if (dto.action === 'warn_user' && targetUserId) {
      await this.notificationsService.createModerationActionNotification(
        targetUserId,
        'Warning Issued',
        `Official warning regarding Dispute ${dispute.ticketNumber}. Reason: ${dto.reason}`
      );
    } else if (dto.action === 'remove_listing') {
      const listingId = dto.listingId || dispute.listingId;
      if (listingId) {
        await this.prisma.listing.update({
          where: { id: listingId },
          data: { status: 'archived' },
        });
      }
    }

    await this.repository.addHistory({
      disputeId: id,
      actorId: user.id,
      action: 'MODERATION_ACTION_TAKEN',
      note: `Executed admin action '${dto.action}'. Reason: ${dto.reason}`,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: `dispute_action_${dto.action}`,
      resource: 'dispute',
      resourceId: id,
      metadata: { action: dto.action, reason: dto.reason, targetUserId },
    });

    return { success: true, actionExecuted: dto.action };
  }

  async addComment(user: AuthenticatedUser, disputeId: string, dto: CreateDisputeCommentDto) {
    await this.findOne(user, disputeId);

    const isInternal = dto.isInternal || false;
    if (isInternal && !this.isUserAdmin(user)) {
      throw new ForbiddenException('Only admin staff can add internal notes');
    }

    const comment = await this.repository.createComment({
      disputeId,
      authorId: user.id,
      content: dto.content,
      isInternal,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'add_dispute_comment',
      resource: 'dispute',
      resourceId: disputeId,
      metadata: { isInternal },
    });

    return comment;
  }

  async getComments(user: AuthenticatedUser, disputeId: string) {
    await this.findOne(user, disputeId);
    const includeInternal = this.isUserAdmin(user);
    return this.repository.getComments(disputeId, includeInternal);
  }

  async getDashboardStats() {
    return this.repository.getDashboardStats();
  }

  // ── Categories ──────────────────────────────────────────────────

  async findAllCategories() {
    return this.repository.findAllCategories();
  }

  async createCategory(user: AuthenticatedUser, dto: CreateDisputeCategoryDto) {
    const category = await this.repository.createCategory({
      ...dto,
      nameAm: dto.nameAm || undefined,
      description: dto.description || undefined,
      sortOrder: dto.sortOrder || undefined,
      isActive: dto.isActive || undefined,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'create_dispute_category',
      resource: 'dispute_category',
      resourceId: category.id,
      metadata: { name: category.name, slug: category.slug },
    });

    return category;
  }

  async updateCategory(user: AuthenticatedUser, id: string, dto: UpdateDisputeCategoryDto) {
    const category = await this.repository.updateCategory(id, {
      ...dto,
      nameAm: dto.nameAm || undefined,
      description: dto.description || undefined,
      sortOrder: dto.sortOrder || undefined,
      isActive: dto.isActive || undefined,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'update_dispute_category',
      resource: 'dispute_category',
      resourceId: id,
      metadata: { changes: dto },
    });

    return category;
  }

  async deleteCategory(user: AuthenticatedUser, id: string) {
    const category = await this.repository.deleteCategory(id);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'delete_dispute_category',
      resource: 'dispute_category',
      resourceId: id,
    });

    return category;
  }

  private isUserAdmin(user: AuthenticatedUser): boolean {
    if (!user || !user.role) return false;
    const adminRoles = ['admin', 'super_admin', 'moderator', 'support'];
    const roleSlug = typeof user.role === 'string' ? user.role : (user.role as any).slug || (user.role as any).name;
    return adminRoles.includes(roleSlug?.toLowerCase());
  }

  private async notifyParties(dispute: any, title: string, body: string) {
    if (dispute.reporterId) {
      await this.notificationsService.createCustomNotification(
        dispute.reporterId,
        'system',
        title,
        body,
        { disputeId: dispute.id, ticketNumber: dispute.ticketNumber }
      );
    }

    if (dispute.reportedUserId) {
      await this.notificationsService.createCustomNotification(
        dispute.reportedUserId,
        'system',
        title,
        body,
        { disputeId: dispute.id, ticketNumber: dispute.ticketNumber }
      );
    }
  }
}

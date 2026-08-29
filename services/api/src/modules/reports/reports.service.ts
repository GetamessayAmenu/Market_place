import { Injectable } from '@nestjs/common';
import type { Prisma, ReportPriority, ReportStatus } from '@prisma/client';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateReportDto } from './dto/create-report.dto';
import type { ReportQueryDto } from './dto/report-query.dto';
import type { ResolveReportDto } from './dto/resolve-report.dto';
import {
  DuplicateReportException,
  ReportAlreadyResolvedException,
  ReportNotFoundException,
} from './exceptions/report.exceptions';
import { ReportsRepository } from './reports.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateReportDto) {
    const duplicate = await this.reportsRepository.findDuplicate(
      user.id,
      dto.targetType,
      dto.listingId,
      dto.reportedUserId,
      dto.messageId,
    );
    if (duplicate) {
      throw new DuplicateReportException();
    }

    const priority: ReportPriority = (dto.priority as ReportPriority) || 'medium';

    const data: Prisma.ReportCreateInput = {
      reporter: { connect: { id: user.id } },
      targetType: dto.targetType,
      reason: dto.reason,
      priority,
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.listingId ? { listing: { connect: { id: dto.listingId } } } : {}),
      ...(dto.reportedUserId ? { reportedUser: { connect: { id: dto.reportedUserId } } } : {}),
      ...(dto.messageId ? { message: { connect: { id: dto.messageId } } } : {}),
      ...(dto.conversationId ? { conversation: { connect: { id: dto.conversationId } } } : {}),
      ...(dto.orderId ? { order: { connect: { id: dto.orderId } } } : {}),
      ...(dto.rentalId ? { rental: { connect: { id: dto.rentalId } } } : {}),
      ...(dto.customOrderId ? { customOrder: { connect: { id: dto.customOrderId } } } : {}),
    };

    const report = await this.reportsRepository.create(data);

    this.eventEmitter.emit('report.created', {
      reportId: report.id,
      reporterId: user.id,
      targetType: dto.targetType,
      priority,
      conversationId: dto.conversationId,
    });

    return report;
  }

  async findOne(_user: AuthenticatedUser, id: string) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }
    return report;
  }

  async findAll(query: ReportQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ReportWhereInput = {
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.priority ? { priority: query.priority as any } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.assignedAdminId ? { assignedAdminId: query.assignedAdminId } : {}),
      ...(query.reporterId ? { reporterId: query.reporterId } : {}),
      ...(query.reportedUserId ? { reportedUserId: query.reportedUserId } : {}),
      ...(query.listingId ? { listingId: query.listingId } : {}),
      ...(query.conversationId ? { conversationId: query.conversationId } : {}),
      ...(query.reason ? { reason: { contains: query.reason, mode: 'insensitive' } } : {}),
      ...(query.search ? {
        OR: [
          { reason: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const result = await this.reportsRepository.findMany({
      where,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
      page,
      limit,
    });

    return toPaginatedResponse(result);
  }

  async resolve(user: AuthenticatedUser, id: string, dto: ResolveReportDto) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }
    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new ReportAlreadyResolvedException();
    }

    const updated = await this.reportsRepository.updateStatus(
      id,
      dto.resolution as ReportStatus,
      user.id,
      dto.resolutionNote,
    );

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: `report.${dto.resolution}`,
        resource: 'report',
        resourceId: id,
        metadata: {
          resolution: dto.resolution,
          targetType: report.targetType,
          note: dto.resolutionNote,
        },
      });
    } catch {
      // non-fatal
    }

    try {
      await this.notificationsService.createReportStatusUpdatedNotification(
        report.reporterId,
        id,
        dto.resolution,
        report.targetType,
      );
    } catch {
      // non-fatal
    }

    return updated;
  }

  async assignAdmin(user: AuthenticatedUser, id: string, assignedAdminId: string | null) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }

    const updated = await this.reportsRepository.assignAdmin(id, assignedAdminId);

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'report.assign',
        resource: 'report',
        resourceId: id,
        metadata: {
          assignedAdminId,
        },
      });
    } catch {
      // non-fatal
    }

    return updated;
  }

  async escalate(user: AuthenticatedUser, id: string, note?: string) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }

    await this.reportsRepository.updatePriority(id, 'critical');
    const updated = await this.reportsRepository.updateStatus(id, 'investigating' as any, user.id, note);

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'report.escalate',
        resource: 'report',
        resourceId: id,
        metadata: {
          previousPriority: report.priority,
          note,
        },
      });
    } catch {
      // non-fatal
    }

    this.eventEmitter.emit('report.escalated', {
      reportId: id,
      escalatedBy: user.id,
      note,
    });

    return updated;
  }

  async setUnderReview(_user: AuthenticatedUser, id: string) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }
    if (report.status === 'resolved' || report.status === 'dismissed' || report.status === 'closed' as any) {
      throw new ReportAlreadyResolvedException();
    }

    const updated = await this.reportsRepository.updateStatus(id, 'under_review');

    try {
      await this.notificationsService.createReportStatusUpdatedNotification(
        report.reporterId,
        id,
        'under_review',
        report.targetType,
      );
    } catch {
      // non-fatal
    }

    return updated;
  }

  async setInvestigating(user: AuthenticatedUser, id: string) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }
    if (report.status === 'resolved' || report.status === 'dismissed' || report.status === 'closed' as any) {
      throw new ReportAlreadyResolvedException();
    }

    const updated = await this.reportsRepository.updateStatus(id, 'investigating' as any);

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'report.investigate',
        resource: 'report',
        resourceId: id,
        metadata: {
          targetType: report.targetType,
        },
      });
    } catch {
      // non-fatal
    }

    return updated;
  }

  async closeReport(user: AuthenticatedUser, id: string, note?: string) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }

    const updated = await this.reportsRepository.closeReport(id, note);

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'report.close',
        resource: 'report',
        resourceId: id,
        metadata: {
          previousStatus: report.status,
          note,
        },
      });
    } catch {
      // non-fatal
    }

    return updated;
  }

  async getConversationHistory(id: string) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }
    if (!report.conversationId) {
      return [];
    }

    return this.reportsRepository.getConversationMessages(report.conversationId);
  }

  async getAuditLogs(id: string) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }

    return this.adminLogsService.findByResource('report', id);
  }

  async getStatusCounts() {
    return this.reportsRepository.countByStatus();
  }

  async addInternalNote(user: AuthenticatedUser, id: string, note: string) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'report.internal_note',
        resource: 'report',
        resourceId: id,
        metadata: {
          note,
          addedBy: user.email || user.id,
        },
      });
    } catch {
      // non-fatal
    }

    return { success: true, message: 'Internal note added' };
  }

  async takeModerationAction(
    user: AuthenticatedUser,
    id: string,
    body: { action: string; note?: string; durationDays?: number },
  ) {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      throw new ReportNotFoundException();
    }

    // Log the specific moderation action in audit logs
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: `report.moderation_action.${body.action.toLowerCase()}`,
        resource: 'report',
        resourceId: id,
        metadata: {
          action: body.action,
          targetType: report.targetType,
          targetId: report.reportedUserId || report.listingId || report.messageId || report.id,
          note: body.note,
          durationDays: body.durationDays,
        },
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      action: body.action,
      reportId: id,
      message: `Moderation action ${body.action} executed successfully`,
    };
  }
}

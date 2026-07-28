import { Injectable } from '@nestjs/common';
import type { Prisma, ReportStatus } from '@prisma/client';

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

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
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

    const data: Prisma.ReportCreateInput = {
      reporter: { connect: { id: user.id } },
      targetType: dto.targetType,
      reason: dto.reason,
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.listingId ? { listing: { connect: { id: dto.listingId } } } : {}),
      ...(dto.reportedUserId ? { reportedUser: { connect: { id: dto.reportedUserId } } } : {}),
      ...(dto.messageId ? { message: { connect: { id: dto.messageId } } } : {}),
      ...(dto.conversationId ? { conversation: { connect: { id: dto.conversationId } } } : {}),
    };

    return this.reportsRepository.create(data);
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
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.reporterId ? { reporterId: query.reporterId } : {}),
      ...(query.reportedUserId ? { reportedUserId: query.reportedUserId } : {}),
      ...(query.listingId ? { listingId: query.listingId } : {}),
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

    try {
      await this.notificationsService.createReportStatusUpdatedNotification(
        report.reporterId,
        id,
        'investigating',
        report.targetType,
      );
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
    if (report.status !== 'resolved' && report.status !== 'dismissed') {
      throw new ReportAlreadyResolvedException();
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

    try {
      await this.notificationsService.createReportStatusUpdatedNotification(
        report.reporterId,
        id,
        'closed',
        report.targetType,
      );
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
}

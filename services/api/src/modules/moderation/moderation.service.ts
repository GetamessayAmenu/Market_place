import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { UploadsService } from '../uploads/uploads.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

import type { BulkModerationActionDto } from './dto/moderation-action.dto';
import type { ModerationQueryDto } from './dto/moderation-query.dto';
import type { ReviewModerationDto } from './dto/moderation-action.dto';
import type { SpamFlagDto } from './dto/moderation-action.dto';
import { MODERATION_EVENTS } from './constants/moderation.constants';
import {
  ModerationApprovedEvent,
  ModerationRejectedEvent,
  ModerationDeletedEvent,
  ModerationRestoredEvent,
  ModerationSpamFlaggedEvent,
} from './events/moderation.events';
import { ModerationRepository } from './moderation.repository';
import { canModerateContent } from './policies/moderation.policies';

@Injectable()
export class ModerationService {
  constructor(
    private readonly moderationRepository: ModerationRepository,
    private readonly adminLogsService: AdminLogsService,
    private readonly uploadsService: UploadsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ModerationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ModerationItemWhereInput = {
      ...(query.itemType && { itemType: query.itemType as any }),
      ...(query.status && { status: query.status as any }),
      ...(query.isSpam === 'true' && { isSpam: true }),
      ...(query.isSpam === 'false' && { isSpam: false }),
      ...(query.search && {
        OR: [
          { content: { contains: query.search, mode: 'insensitive' } },
          { review: { title: { contains: query.search, mode: 'insensitive' } } },
          { review: { body: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
      ...(query.sellerId && {
        review: { sellerId: query.sellerId },
      }),
      ...(query.rating && {
        review: { rating: query.rating },
      }),
      ...(query.fromDate && {
        createdAt: { gte: new Date(query.fromDate) },
      }),
      ...(query.toDate && {
        createdAt: { lte: new Date(query.toDate) },
      }),
      deletedAt: null,
    };

    const orderBy: Prisma.ModerationItemOrderByWithRelationInput = {};
    if (query.sortBy === 'createdAt') {
      orderBy.createdAt = query.sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (query.sortBy === 'rating') {
      orderBy.review = { rating: query.sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (query.sortBy === 'reportCount') {
      orderBy.reportCount = query.sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (query.sortBy === 'spamScore') {
      orderBy.spamScore = query.sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const result = await this.moderationRepository.findManyWithRelations({
      where,
      orderBy,
      page,
      limit,
    });

    return toPaginatedResponse(result);
  }

  async findOne(id: string) {
    const item = await this.moderationRepository.findById(id);
    if (!item || item.deletedAt) {
      throw new NotFoundException('Moderation item not found');
    }
    return item;
  }

  async moderateReview(
    reviewId: string,
    dto: ReviewModerationDto,
    admin: AuthenticatedUser,
  ) {
    if (!canModerateContent(admin)) {
      throw new ForbiddenException('You do not have permission to moderate content');
    }

    const review = await this.moderationRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updateData: Prisma.ReviewUpdateInput = {
      moderationStatus: dto.status as any,
      ...(dto.reason !== undefined && { moderationReason: dto.reason }),
      moderatedBy: { connect: { id: admin.id } },
      moderatedAt: new Date(),
      ...(dto.isSpam !== undefined && { isSpam: dto.isSpam }),
    };

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        listing: true,
        reviewer: true,
        seller: true,
      },
    });

    // Log the action
    const actionMap: Record<string, string> = {
      approved: 'review.approved',
      rejected: 'review.rejected',
      under_review: 'review.under_review',
      deleted: 'review.deleted',
      restored: 'review.restored',
    };

    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: actionMap[dto.status] || 'review.moderated',
      resource: 'review',
      resourceId: reviewId,
      metadata: {
        status: dto.status,
        reason: dto.reason,
        isSpam: dto.isSpam,
      },
    });

    // Emit events
    if (dto.status === 'approved') {
      this.eventEmitter.emit(
        MODERATION_EVENTS.APPROVED,
        new ModerationApprovedEvent(reviewId, admin.id),
      );
    } else if (dto.status === 'rejected') {
      this.eventEmitter.emit(
        MODERATION_EVENTS.REJECTED,
        new ModerationRejectedEvent(reviewId, admin.id, dto.reason),
      );
    }

    return updatedReview;
  }

  async moderateItem(
    itemId: string,
    action: 'approve' | 'reject' | 'delete' | 'restore',
    admin: AuthenticatedUser,
    reason?: string,
  ) {
    if (!canModerateContent(admin)) {
      throw new ForbiddenException('You do not have permission to moderate content');
    }

    const item = await this.moderationRepository.findById(itemId);
    if (!item || item.deletedAt) {
      throw new NotFoundException('Moderation item not found');
    }

    let result;
    const now = new Date();

    if (action === 'approve') {
      result = await this.moderationRepository.update(itemId, {
        status: 'approved',
        rejectionReason: null,
        moderatedBy: { connect: { id: admin.id } },
        moderatedAt: now,
      });
      this.eventEmitter.emit(
        MODERATION_EVENTS.APPROVED,
        new ModerationApprovedEvent(itemId, admin.id),
      );
    } else if (action === 'reject') {
      result = await this.moderationRepository.update(itemId, {
        status: 'rejected',
        ...(reason !== undefined && { rejectionReason: reason }),
        moderatedBy: { connect: { id: admin.id } },
        moderatedAt: now,
      });
      this.eventEmitter.emit(
        MODERATION_EVENTS.REJECTED,
        new ModerationRejectedEvent(itemId, admin.id, reason),
      );
    } else if (action === 'delete') {
      result = await this.moderationRepository.softDelete(itemId);
      
      // Delete image from cloudinary if applicable
      if (item.cloudinaryPublicId) {
        await this.uploadsService.deleteImages([item.cloudinaryPublicId]);
      }
      
      this.eventEmitter.emit(
        MODERATION_EVENTS.DELETED,
        new ModerationDeletedEvent(itemId, admin.id),
      );
    } else if (action === 'restore') {
      result = await this.moderationRepository.restore(itemId);
      this.eventEmitter.emit(
        MODERATION_EVENTS.RESTORED,
        new ModerationRestoredEvent(itemId, admin.id),
      );
    }

    // Log the action
    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: `moderation.${action}`,
      resource: 'moderation_item',
      resourceId: itemId,
      metadata: { reason, itemType: item.itemType },
    });

    return result;
  }

  async toggleSpamFlag(itemId: string, dto: SpamFlagDto, admin: AuthenticatedUser) {
    if (!canModerateContent(admin)) {
      throw new ForbiddenException('You do not have permission to moderate content');
    }

    const item = await this.moderationRepository.findById(itemId);
    if (!item || item.deletedAt) {
      throw new NotFoundException('Moderation item not found');
    }

    const result = await this.moderationRepository.update(itemId, {
      isSpam: dto.isSpam,
      spamScore: dto.isSpam ? (item.spamScore || 0) + 10 : 0,
      moderatedBy: { connect: { id: admin.id } },
      moderatedAt: new Date(),
    });

    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: dto.isSpam ? 'moderation.spam_flagged' : 'moderation.spam_unflagged',
      resource: 'moderation_item',
      resourceId: itemId,
      metadata: { reason: dto.reason },
    });

    if (dto.isSpam) {
      this.eventEmitter.emit(
        MODERATION_EVENTS.SPAM_FLAGGED,
        new ModerationSpamFlaggedEvent(itemId, admin.id, dto.reason),
      );
    }

    return result;
  }

  async bulkAction(dto: BulkModerationActionDto, admin: AuthenticatedUser) {
    if (!canModerateContent(admin)) {
      throw new ForbiddenException('You do not have permission to moderate content');
    }

    const items = await this.moderationRepository.findByIds(dto.itemIds);
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const item of items) {
      try {
        if (dto.action === 'approve') {
          await this.moderateItem(item.id, 'approve', admin);
        } else if (dto.action === 'reject') {
          await this.moderateItem(item.id, 'reject', admin, dto.reason);
        } else if (dto.action === 'delete') {
          await this.moderateItem(item.id, 'delete', admin);
        } else if (dto.action === 'restore') {
          await this.moderateItem(item.id, 'restore', admin);
        }
        results.push({ id: item.id, success: true });
      } catch (err) {
        results.push({
          id: item.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const missing = dto.itemIds.filter(
      (id) => !items.some((i) => i.id === id),
    );
    for (const id of missing) {
      results.push({ id, success: false, error: 'Item not found' });
    }

    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: 'moderation.bulk_action',
      resource: 'moderation_item',
      metadata: {
        action: dto.action,
        itemIds: dto.itemIds,
        reason: dto.reason,
      },
    });

    return {
      processed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  async getStats() {
    return this.moderationRepository.getStats();
  }

  async getModerationHistory(itemId: string) {
    const logs = await this.adminLogsService.findLogs({
      resourceId: itemId,
      resource: 'moderation_item',
      limit: 100,
    });
    return logs.data;
  }
}

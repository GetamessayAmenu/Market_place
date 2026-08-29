import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import type { MessagingRestrictionType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessagingRestrictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminLogsService: AdminLogsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Check if a user currently has an active messaging restriction.
   * Automatically expires temporary restrictions if the expiration date has passed.
   */
  async getActiveRestriction(userId: string) {
    const active = await this.prisma.messagingRestriction.findFirst({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!active) {
      return null;
    }

    // Handle automatic expiration of temporary restrictions
    if (active.type === 'temporary' && active.expiresAt && active.expiresAt <= new Date()) {
      await this.prisma.messagingRestriction.update({
        where: { id: active.id },
        data: { isActive: false },
      });

      this.eventEmitter.emit('messaging.restriction_expired', {
        userId,
        restrictionId: active.id,
      });

      return null;
    }

    return active;
  }

  /**
   * Create a new messaging restriction for a user (temporary or permanent).
   */
  async createRestriction(
    userId: string,
    type: MessagingRestrictionType,
    reason: string,
    createdById: string,
    expiresAt?: Date | string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (type === 'temporary' && !expiresAt) {
      throw new BadRequestException('Expiration date is required for temporary restrictions');
    }

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    if (parsedExpiresAt && parsedExpiresAt <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future');
    }

    // Deactivate previous active restrictions
    await this.prisma.messagingRestriction.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const restriction = await this.prisma.messagingRestriction.create({
      data: {
        userId,
        type,
        reason,
        createdById,
        startsAt: new Date(),
        expiresAt: parsedExpiresAt,
        isActive: true,
      },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
        createdBy: { select: { id: true, displayName: true, email: true } },
      },
    });

    try {
      await this.adminLogsService.createLog({
        actorId: createdById,
        action: 'user.restrict_messaging',
        resource: 'user',
        resourceId: userId,
        metadata: {
          restrictionId: restriction.id,
          type,
          reason,
          expiresAt: parsedExpiresAt,
        },
      });
    } catch {
      // Non-fatal
    }

    this.eventEmitter.emit('messaging.restricted', {
      userId,
      restrictionId: restriction.id,
      type,
      reason,
      expiresAt: parsedExpiresAt,
    });

    return restriction;
  }

  /**
   * Lift an active messaging restriction for a user.
   */
  async removeRestriction(userId: string, restrictionId: string, adminId: string) {
    const restriction = await this.prisma.messagingRestriction.findFirst({
      where: { id: restrictionId, userId },
    });

    if (!restriction) {
      throw new NotFoundException('Restriction record not found');
    }

    const updated = await this.prisma.messagingRestriction.update({
      where: { id: restrictionId },
      data: { isActive: false },
    });

    try {
      await this.adminLogsService.createLog({
        actorId: adminId,
        action: 'user.unrestrict_messaging',
        resource: 'user',
        resourceId: userId,
        metadata: {
          restrictionId,
          previousType: restriction.type,
        },
      });
    } catch {
      // Non-fatal
    }

    this.eventEmitter.emit('messaging.unrestricted', {
      userId,
      restrictionId,
    });

    return updated;
  }

  /**
   * Get restriction history for a user.
   */
  async getUserRestrictionsHistory(userId: string) {
    return this.prisma.messagingRestriction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, displayName: true, email: true } },
      },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { VerificationType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { VerificationService } from '../auth/verification/verification.service';
import { NotificationsService } from '../notifications/notifications.service';

import type { AdminVerificationQueryDto, ReviewVerificationDto } from './dto/verification.dto';

@Injectable()
export class VerificationAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminLogsService: AdminLogsService,
    private readonly verificationService: VerificationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async verifyEmail(token: string) {
    const payload = await this.verificationService.consumeToken(VerificationType.email, token);
    if (!payload) {
      throw new NotFoundException({ code: 'INVALID_TOKEN', message: 'Invalid or expired verification token' });
    }
    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await this.notificationsService.createSellerVerifiedNotification(payload.userId, 'email');
    return { verified: true, type: 'email' };
  }

  async verifyPhone(token: string) {
    const payload = await this.verificationService.consumeToken(VerificationType.phone, token);
    if (!payload) {
      throw new NotFoundException({ code: 'INVALID_TOKEN', message: 'Invalid or expired verification token' });
    }
    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { phoneVerifiedAt: new Date() },
    });
    await this.notificationsService.createSellerVerifiedNotification(payload.userId, 'phone');
    return { verified: true, type: 'phone' };
  }

  async findAll(query: AdminVerificationQueryDto) {
    const page = 1;
    const limit = 20;
    const skip = 0;

    const where: Prisma.VerificationRequestWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.verificationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, displayName: true, email: true } },
          reviewedBy: { select: { id: true, displayName: true } },
        },
      }),
      this.prisma.verificationRequest.count({ where }),
    ]);

    return toPaginatedResponse({ items, total, page, limit });
  }

  async review(
    admin: { id: string },
    verificationId: string,
    dto: ReviewVerificationDto,
  ) {
    const verification = await this.prisma.verificationRequest.findFirst({
      where: { id: verificationId, deletedAt: null },
    });
    if (!verification) {
      throw new NotFoundException('Verification request not found');
    }

    const updated = await this.prisma.verificationRequest.update({
      where: { id: verificationId },
      data: {
        status: dto.decision,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        ...(dto.decision === 'rejected' && dto.reason ? { rejectionReason: dto.reason } : {}),
      },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
      },
    });

    if (dto.decision === 'approved') {
      if (verification.type === 'identity' || verification.type === 'business') {
        await this.notificationsService.createSellerVerifiedNotification(
          verification.userId,
          verification.type,
        );
      }
    }

    try {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: `verification.${dto.decision}`,
        resource: 'verification_request',
        resourceId: verificationId,
        metadata: {
          type: verification.type,
          decision: dto.decision,
          reason: dto.reason,
        },
      });
    } catch {
      // non-fatal
    }

    return updated;
  }
}

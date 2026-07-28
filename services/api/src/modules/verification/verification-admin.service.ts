import { Injectable, NotFoundException } from '@nestjs/common';
import { VerificationType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { VerificationService } from '../auth/verification/verification.service';
import { NotificationsService } from '../notifications/notifications.service';

import type { AdminVerificationQueryDto, ReviewVerificationDto } from './dto/verification.dto';
import type { GrantVerifiedDesignerDto, RevokeVerifiedDesignerDto } from './dto/verified-designer.dto';
import type { CreateVendorKycDto, ReviewVendorKycDto, VendorKycQueryDto } from './dto/vendor-kyc.dto';

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

  async grantVerifiedDesigner(
    admin: { id: string },
    userId: string,
    dto: GrantVerifiedDesignerDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerifiedDesigner) {
      throw new NotFoundException('User is already a verified designer');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerifiedDesigner: true,
        verifiedDesignerAt: new Date(),
        verifiedDesignerById: admin.id,
      },
    });

    await this.notificationsService.createSellerVerifiedNotification(userId, 'verified_designer');

    try {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'grant_verified_designer',
        resource: 'user',
        resourceId: userId,
        metadata: { reason: dto.reason },
      });
    } catch {
      // non-fatal
    }

    return updated;
  }

  async revokeVerifiedDesigner(
    admin: { id: string },
    userId: string,
    dto: RevokeVerifiedDesignerDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isVerifiedDesigner) {
      throw new NotFoundException('User is not a verified designer');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerifiedDesigner: false,
        verifiedDesignerAt: null,
        verifiedDesignerById: null,
      },
    });

    try {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'revoke_verified_designer',
        resource: 'user',
        resourceId: userId,
        metadata: { reason: dto.reason },
      });
    } catch {
      // non-fatal
    }

    return updated;
  }

  // Vendor KYC Profile Methods
  async findVendorKycProfiles(query: VendorKycQueryDto) {
    const page = 1;
    const limit = 20;
    const skip = 0;

    const where: Prisma.VendorKycProfileWhereInput = {
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.tinNumber ? { tinNumber: query.tinNumber } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.vendorKycProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              phone: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.vendorKycProfile.count({ where }),
    ]);

    return toPaginatedResponse({ items, total, page, limit });
  }

  async findVendorKycProfile(id: string) {
    const profile = await this.prisma.vendorKycProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Vendor KYC profile not found');
    }

    return profile;
  }

  async createVendorKycProfile(userId: string, dto: CreateVendorKycDto) {
    const existing = await this.prisma.vendorKycProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new NotFoundException('User already has a KYC profile');
    }

    const profile = await this.prisma.vendorKycProfile.create({
      data: {
        userId,
        businessName: dto.businessName,
        ...(dto.businessNameAm ? { businessNameAm: dto.businessNameAm } : {}),
        tinNumber: dto.tinNumber,
        licenseUrl: dto.licenseUrl,
        ...(dto.licenseCloudinaryId ? { licenseCloudinaryId: dto.licenseCloudinaryId } : {}),
        status: 'PENDING',
      },
      include: {
        user: true,
      },
    });

    // Notify admin users about new KYC submission
    await this.notificationsService.createSellerVerifiedNotification(userId, 'business');

    return profile;
  }

  async reviewVendorKyc(
    admin: { id: string },
    profileId: string,
    dto: ReviewVendorKycDto,
  ) {
    const profile = await this.prisma.vendorKycProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Vendor KYC profile not found');
    }

    const updated = await this.prisma.vendorKycProfile.update({
      where: { id: profileId },
      data: {
        status: dto.decision as any,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        ...(dto.decision === 'REJECTED' && dto.reason ? { rejectionReason: dto.reason } : {}),
      },
      include: {
        user: true,
        reviewedBy: true,
      },
    });

    // Notify user about KYC decision
    await this.notificationsService.createSellerVerifiedNotification(profile.userId, 'business');

    try {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: `vendor_kyc.${dto.decision.toLowerCase()}`,
        resource: 'vendor_kyc_profile',
        resourceId: profileId,
        metadata: {
          decision: dto.decision,
          reason: dto.reason,
          businessName: profile.businessName,
        },
      });
    } catch {
      // non-fatal
    }

    return updated;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RentalsRepository } from './rentals.repository';
import type { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import type { UpdateRentalOrderDto } from './dto/update-rental-order.dto';
import type { RentalQueryDto } from './dto/rental-query.dto';
import type { CreateRentalExtensionDto } from './dto/create-rental-extension.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class RentalsService {
  constructor(
    private readonly repository: RentalsRepository,
    private readonly prisma: PrismaService,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: RentalQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RentalOrderWhereInput = {
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.listingId ? { listingId: query.listingId } : {}),
      ...(query.renterId ? { renterId: query.renterId } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.startDateFrom || query.startDateTo
        ? {
            startDate: {
              ...(query.startDateFrom ? { gte: new Date(query.startDateFrom) } : {}),
              ...(query.startDateTo ? { lte: new Date(query.startDateTo) } : {}),
            },
          }
        : {}),
      ...(query.endDateFrom || query.endDateTo
        ? {
            endDate: {
              ...(query.endDateFrom ? { gte: new Date(query.endDateFrom) } : {}),
              ...(query.endDateTo ? { lte: new Date(query.endDateTo) } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.RentalOrderOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const [items, total] = await Promise.all([
      this.repository.findMany({ where, orderBy, skip, take: limit }),
      this.repository.count(where),
    ]);

    return toPaginatedResponse({ items, total, page, limit });
  }

  async findOne(id: string) {
    const rental = await this.repository.findById(id);
    if (!rental) {
      throw new NotFoundException('Rental order not found');
    }
    return {
      success: true,
      data: rental,
    };
  }

  async create(dto: CreateRentalOrderDto, user: AuthenticatedUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: {
        id: true,
        title: true,
        rentalPricePerDay: true,
        rentalDeposit: true,
        sellerId: true,
        availableForRent: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (!listing.availableForRent) {
      throw new BadRequestException('This listing is not available for rent');
    }

    if (listing.sellerId === user.id) {
      throw new BadRequestException('You cannot rent your own listing');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check availability
    const isAvailable = await this.repository.checkAvailability(
      dto.listingId,
      startDate,
      endDate,
    );

    if (!isAvailable) {
      throw new BadRequestException('This listing is not available for the selected dates');
    }

    // Calculate costs
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = Number(listing.rentalPricePerDay || 0);
    const totalAmount = days * dailyRate;
    const securityDeposit = Number(listing.rentalDeposit || 0);

    // Generate order number
    const orderNumber = `RNT-${Date.now().toString().slice(-8)}`;

    const data: Prisma.RentalOrderCreateInput = {
      orderNumber,
      listing: { connect: { id: dto.listingId } },
      renter: { connect: { id: user.id } },
      seller: { connect: { id: listing.sellerId } },
      startDate,
      endDate,
      dailyRate,
      totalAmount,
      securityDeposit,
      status: 'REQUESTED',
      ...(dto.handoverLocation ? { handoverLocation: dto.handoverLocation } : {}),
      ...(dto.preHandoverCondition ? { preHandoverCondition: dto.preHandoverCondition } : {}),
      ...(dto.preHandoverPhotos ? { preHandoverPhotos: dto.preHandoverPhotos } : {}),
    };

    const created = await this.repository.create(data);

    // Notify seller
    await this.notificationsService.createSellerVerifiedNotification(listing.sellerId, 'rental_request');

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'create_rental_order',
        resource: 'rental_order',
        resourceId: created.id,
        metadata: {
          orderNumber: created.orderNumber,
          listingId: dto.listingId,
          totalAmount: created.totalAmount,
        },
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: created,
    };
  }

  async update(id: string, dto: UpdateRentalOrderDto, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    const data: Prisma.RentalOrderUpdateInput = {
      ...(dto.status ? { status: dto.status as any } : {}),
      ...(dto.handoverAt ? { handoverAt: new Date(dto.handoverAt) } : {}),
      ...(dto.returnedAt ? { returnedAt: new Date(dto.returnedAt) } : {}),
      ...(dto.actualReturnDate ? { actualReturnDate: new Date(dto.actualReturnDate) } : {}),
      ...(dto.preHandoverCondition !== undefined ? { preHandoverCondition: dto.preHandoverCondition } : {}),
      ...(dto.preHandoverPhotos !== undefined ? { preHandoverPhotos: dto.preHandoverPhotos } : {}),
      ...(dto.postReturnCondition !== undefined ? { postReturnCondition: dto.postReturnCondition } : {}),
      ...(dto.postReturnPhotos !== undefined ? { postReturnPhotos: dto.postReturnPhotos } : {}),
      ...(dto.damageNotes !== undefined ? { damageNotes: dto.damageNotes } : {}),
      ...(dto.damageCost !== undefined ? { damageCost: dto.damageCost } : {}),
      ...(dto.depositRefunded !== undefined ? { depositRefunded: dto.depositRefunded } : {}),
      ...(dto.depositRefundAmount !== undefined ? { depositRefundAmount: dto.depositRefundAmount } : {}),
      ...(dto.depositRefundReason !== undefined ? { depositRefundReason: dto.depositRefundReason } : {}),
    };

    const updated = await this.repository.update(id, data);

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'update_rental_order',
        resource: 'rental_order',
        resourceId: id,
        metadata: { status: dto.status },
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  async approve(id: string, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.status !== 'REQUESTED') {
      throw new BadRequestException('Only requested rentals can be approved');
    }

    const updated = await this.repository.update(id, {
      status: 'APPROVED',
    });

    // Notify renter
    await this.notificationsService.createSellerVerifiedNotification(existing.renterId, 'rental_approved');

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'approve_rental_order',
        resource: 'rental_order',
        resourceId: id,
        metadata: { orderNumber: existing.orderNumber },
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  async createExtension(rentalOrderId: string, dto: CreateRentalExtensionDto, user: AuthenticatedUser) {
    const rental = await this.repository.findById(rentalOrderId);
    if (!rental) {
      throw new NotFoundException('Rental order not found');
    }

    if (rental.status !== 'ACTIVE') {
      throw new BadRequestException('Extensions can only be requested for active rentals');
    }

    const newEndDate = new Date(dto.newEndDate);
    if (newEndDate <= rental.endDate) {
      throw new BadRequestException('New end date must be after current end date');
    }

    const days = Math.ceil((newEndDate.getTime() - new Date(rental.endDate).getTime()) / (1000 * 60 * 60 * 24));
    const additionalCost = days * Number(rental.dailyRate);

    const data: Prisma.RentalExtensionCreateInput = {
      rentalOrder: { connect: { id: rentalOrderId } },
      requestedBy: { connect: { id: user.id } },
      additionalDays: dto.additionalDays,
      newEndDate,
      additionalCost,
      status: 'REQUESTED',
    };

    const extension = await this.repository.createExtension(data);

    // Notify the other party
    const notifyUserId = user.id === rental.renterId ? rental.sellerId : rental.renterId;
    await this.notificationsService.createSellerVerifiedNotification(notifyUserId, 'rental_extension_request');

    return {
      success: true,
      data: extension,
    };
  }

  async approveExtension(extensionId: string, user: AuthenticatedUser) {
    const extension = await this.prisma.rentalExtension.findUnique({
      where: { id: extensionId },
      include: { rentalOrder: true },
    });

    if (!extension) {
      throw new NotFoundException('Extension request not found');
    }

    if (extension.status !== 'REQUESTED') {
      throw new BadRequestException('Extension has already been processed');
    }

    // Update rental order end date
    await this.repository.update(extension.rentalOrderId, {
      endDate: extension.newEndDate,
    });

    // Update extension status
    const updated = await this.repository.updateExtension(extensionId, {
      status: 'APPROVED',
      approvedById: user.id,
      approvedAt: new Date(),
    });

    return {
      success: true,
      data: updated,
    };
  }

  async getUserRentals(userId: string, role: 'renter' | 'seller') {
    const rentals = await this.repository.findByUser(userId, role);
    return {
      success: true,
      data: rentals,
    };
  }
}

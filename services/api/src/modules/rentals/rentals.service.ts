import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RentalsRepository } from './rentals.repository';
import type { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import type { UpdateRentalOrderDto } from './dto/update-rental-order.dto';
import type { RentalQueryDto } from './dto/rental-query.dto';
import type { CreateRentalExtensionDto } from './dto/create-rental-extension.dto';
import type { CreateConditionLogDto } from './dto/create-condition-log.dto';
import type { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';

@Injectable()
export class RentalsService {
  constructor(
    private readonly repository: RentalsRepository,
    private readonly prisma: PrismaService,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue(QUEUE_NAMES.RENTAL_EXPIRATION) private readonly expirationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.RENTAL_REMINDERS) private readonly remindersQueue: Queue,
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
        rentalThreeDayRate: true,
        rentalWeeklyRate: true,
        rentalDeposit: true,
        sellerId: true,
        availableForRent: true,
        minRentalDurationDays: true,
        maxRentalDurationDays: true,
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

    // Check minimum and maximum duration
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days < listing.minRentalDurationDays) {
      throw new BadRequestException(`Minimum rental duration is ${listing.minRentalDurationDays} days`);
    }
    if (listing.maxRentalDurationDays && days > listing.maxRentalDurationDays) {
      throw new BadRequestException(`Maximum rental duration is ${listing.maxRentalDurationDays} days`);
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

    // Calculate costs based on pricing tier
    let dailyRate = Number(listing.rentalPricePerDay || 0);
    let totalAmount = 0;
    let pricingTierUsed = dto.pricingTier || 'DAILY';

    switch (dto.pricingTier) {
      case 'THREE_DAY_EVENT':
        if (listing.rentalThreeDayRate) {
          totalAmount = Number(listing.rentalThreeDayRate);
          dailyRate = totalAmount / 3;
        } else {
          // Fallback to daily rate
          totalAmount = days * dailyRate;
        }
        break;
      case 'WEEKLY':
        if (listing.rentalWeeklyRate) {
          totalAmount = Number(listing.rentalWeeklyRate);
          dailyRate = totalAmount / 7;
        } else {
          // Fallback to daily rate
          totalAmount = days * dailyRate;
        }
        break;
      default:
        totalAmount = days * dailyRate;
    }

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
      pricingTierUsed: pricingTierUsed as any,
      ...(dto.handoverLocation ? { handoverLocation: dto.handoverLocation } : {}),
      ...(dto.pickupHub ? { pickupHub: dto.pickupHub } : {}),
      ...(dto.preHandoverCondition ? { preHandoverCondition: dto.preHandoverCondition } : {}),
      ...(dto.preHandoverPhotos ? { preHandoverPhotos: dto.preHandoverPhotos } : {}),
    };

    const created = await this.repository.create(data);

    // Schedule auto-expiration job (24 hours from now)
    await this.expirationQueue.add(
      'rental-expiration',
      {
        rentalOrderId: created.id,
        renterId: user.id,
        sellerId: listing.sellerId,
        listingId: dto.listingId,
      },
      {
        delay: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      },
    );

    // Schedule pre-return reminder (12 hours before end date)
    const preReturnDelay = endDate.getTime() - Date.now() - (12 * 60 * 60 * 1000);
    if (preReturnDelay > 0) {
      await this.remindersQueue.add(
        'rental-reminder',
        {
          type: 'pre_return',
          rentalOrderId: created.id,
          renterId: user.id,
          sellerId: listing.sellerId,
          endDate: endDate.toISOString(),
          hoursUntil: 12,
        },
        {
          delay: preReturnDelay,
        },
      );
    }

    // Schedule overdue reminder (2 hours after end date)
    const overdueDelay = endDate.getTime() - Date.now() + (2 * 60 * 60 * 1000);
    if (overdueDelay > 0) {
      await this.remindersQueue.add(
        'rental-reminder',
        {
          type: 'overdue',
          rentalOrderId: created.id,
          renterId: user.id,
          sellerId: listing.sellerId,
          endDate: endDate.toISOString(),
        },
        {
          delay: overdueDelay,
        },
      );
    }

    // Notify seller
    await this.notificationsService.createCustomNotification(
      listing.sellerId,
      'rental_request',
      'New Rental Request',
      `You have a new rental request for ${listing.title}`,
      { listingId: dto.listingId, rentalOrderId: created.id },
    );

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

    // Verify user is the seller
    if (existing.sellerId !== user.id) {
      throw new BadRequestException('Only the seller can approve rental requests');
    }

    const updated = await this.repository.update(id, {
      status: 'APPROVED',
    });

    // Cancel concurrent pending requests for overlapping dates
    await this.repository.cancelConcurrentPendingRequests(
      existing.listingId,
      existing.startDate,
      existing.endDate,
      id,
    );

    // Notify renter
    await this.notificationsService.createCustomNotification(
      existing.renterId,
      'rental_approved',
      'Rental Request Approved',
      `Your rental request for ${existing.listing.title} has been approved`,
      { rentalOrderId: id },
    );

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
      requestedByUser: { connect: { id: user.id } },
      additionalDays: dto.additionalDays,
      newEndDate,
      additionalCost,
      status: 'REQUESTED',
    };

    const extension = await this.repository.createExtension(data);

    // Notify the other party
    const notifyUserId = user.id === rental.renterId ? rental.sellerId : rental.renterId;
    await this.notificationsService.createCustomNotification(
      notifyUserId,
      'rental_extension_request',
      'Rental Extension Request',
      `A rental extension has been requested`,
      { rentalOrderId },
    );

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
      approvedByUser: { connect: { id: user.id } },
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

  // Condition Log methods
  async createConditionLog(bookingId: string, dto: CreateConditionLogDto, user: AuthenticatedUser) {
    const booking = await this.repository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Rental booking not found');
    }

    // Verify user is either renter or seller
    if (booking.renterId !== user.id && booking.sellerId !== user.id) {
      throw new BadRequestException('Only the renter or seller can create condition logs');
    }

    const data = {
      booking: { connect: { id: bookingId } },
      type: dto.type as any,
      photoUrls: dto.photoUrls,
      notes: dto.notes,
      loggedByUser: { connect: { id: user.id } },
    };

    const created = await this.repository.createConditionLog(data);

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'create_condition_log',
        resource: 'rental_condition_log',
        resourceId: created.id,
        metadata: {
          bookingId,
          type: dto.type,
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

  async getConditionLogs(bookingId: string) {
    const logs = await this.repository.findConditionLogsByBooking(bookingId);
    return {
      success: true,
      data: logs,
    };
  }

  // Blackout Date methods
  async createBlackoutDate(dto: CreateBlackoutDateDto, user: AuthenticatedUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { sellerId: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Verify user is the seller
    if (listing.sellerId !== user.id) {
      throw new BadRequestException('Only the seller can create blackout dates');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const data = {
      listing: { connect: { id: dto.listingId } },
      startDate,
      endDate,
      reason: dto.reason,
      createdByUser: { connect: { id: user.id } },
    };

    const created = await this.repository.createBlackoutDate(data);

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'create_blackout_date',
        resource: 'rental_blackout_date',
        resourceId: created.id,
        metadata: {
          listingId: dto.listingId,
          startDate: dto.startDate,
          endDate: dto.endDate,
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

  async getBlackoutDates(listingId: string) {
    const dates = await this.repository.findBlackoutDatesByListing(listingId);
    return {
      success: true,
      data: dates,
    };
  }

  async deleteBlackoutDate(id: string, user: AuthenticatedUser) {
    const result = await this.repository.deleteBlackoutDate(id, user.id);

    if (result.count === 0) {
      throw new NotFoundException('Blackout date not found or you do not have permission to delete it');
    }

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'delete_blackout_date',
        resource: 'rental_blackout_date',
        resourceId: id,
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      message: 'Blackout date deleted successfully',
    };
  }

  // Dispute handling
  async flagAsDisputed(id: string, reason: string, evidencePhotos: string[], user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    // Verify user is either renter or seller
    if (existing.renterId !== user.id && existing.sellerId !== user.id) {
      throw new BadRequestException('Only the renter or seller can flag a rental as disputed');
    }

    if (existing.status === 'DISPUTED') {
      throw new BadRequestException('This rental is already flagged as disputed');
    }

    const updated = await this.repository.update(id, {
      status: 'DISPUTED',
      cancellationReason: reason,
      postReturnPhotos: evidencePhotos,
    });

    // Notify admin team for escalation
    await this.notificationsService.createCustomNotification(
      user.id,
      'rental_disputed',
      'Rental Dispute Flagged',
      `A rental has been flagged as disputed`,
      { rentalOrderId: id, reason },
    );

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'flag_rental_disputed',
        resource: 'rental_order',
        resourceId: id,
        metadata: {
          orderNumber: existing.orderNumber,
          reason,
        },
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class RentalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: {
    where?: Prisma.RentalOrderWhereInput;
    orderBy?: Prisma.RentalOrderOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.rentalOrder.findMany({
      ...args,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            rentalPricePerDay: true,
            rentalDeposit: true,
            rentalPickupLocation: true,
            rentalNotes: true,
            city: true,
            images: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        renter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        extensions: {
          orderBy: { createdAt: 'desc' },
        },
        histories: {
          orderBy: { createdAt: 'asc' },
          include: {
            actor: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    if (!id || typeof id !== 'string') return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return null;

    return this.prisma.rentalOrder.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            rentalPricePerDay: true,
            rentalDeposit: true,
            minRentalDurationDays: true,
            maxRentalDurationDays: true,
            rentalPickupLocation: true,
            rentalNotes: true,
            city: true,
            status: true,
            sellerId: true,
            images: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        renter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        extensions: {
          orderBy: { createdAt: 'desc' },
          include: {
            requestedByUser: {
              select: {
                id: true,
                displayName: true,
              },
            },
            approvedByUser: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        histories: {
          orderBy: { createdAt: 'asc' },
          include: {
            actor: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        conditionLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            loggedByUser: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        conversationsAsRental: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return this.prisma.rentalOrder.findUnique({
      where: { orderNumber },
      include: {
        listing: true,
        renter: true,
        seller: true,
        extensions: true,
        histories: true,
      },
    });
  }

  async create(data: Prisma.RentalOrderCreateInput) {
    return this.prisma.rentalOrder.create({
      data,
      include: {
        listing: true,
        renter: true,
        seller: true,
      },
    });
  }

  async update(id: string, data: Prisma.RentalOrderUpdateInput) {
    return this.prisma.rentalOrder.update({
      where: { id },
      data,
      include: {
        listing: true,
        renter: true,
        seller: true,
        extensions: true,
        histories: true,
      },
    });
  }

  async count(where?: Prisma.RentalOrderWhereInput) {
    if (where) {
      return this.prisma.rentalOrder.count({ where });
    }
    return this.prisma.rentalOrder.count();
  }

  /**
   * Check availability for a listing during a date range.
   * Confirmed/accepted/active rentals block dates.
   * Blackout dates also block dates.
   */
  async checkAvailability(
    listingId: string,
    startDate: Date,
    endDate: Date,
    excludeOrderId?: string,
  ) {
    const activeStatuses: any[] = [
      'ACCEPTED',
      'APPROVED',
      'READY_FOR_PICKUP',
      'HANDOVER_PENDING',
      'ACTIVE',
      'RETURN_PENDING',
      'RETURN_INITIATED',
      'RETURNED_PENDING_INSPECTION',
    ];

    const where: Prisma.RentalOrderWhereInput = {
      listingId,
      status: {
        in: activeStatuses,
      },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    };

    if (excludeOrderId) {
      where.id = { not: excludeOrderId };
    }

    const conflictingOrders = await this.prisma.rentalOrder.findMany({
      where,
      select: { id: true, startDate: true, endDate: true, status: true },
    });

    if (conflictingOrders.length > 0) {
      return false;
    }

    // Check blackout dates
    const conflictingBlackoutDates = await this.prisma.rentalBlackoutDate.findMany({
      where: {
        listingId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { id: true },
    });

    return conflictingBlackoutDates.length === 0;
  }

  /**
   * Get booked date ranges for a listing (used by frontend calendar).
   */
  async getBookedDateRanges(listingId: string) {
    const activeStatuses: any[] = [
      'ACCEPTED',
      'APPROVED',
      'READY_FOR_PICKUP',
      'HANDOVER_PENDING',
      'ACTIVE',
      'RETURN_PENDING',
      'RETURN_INITIATED',
      'RETURNED_PENDING_INSPECTION',
    ];

    const bookings = await this.prisma.rentalOrder.findMany({
      where: {
        listingId,
        status: { in: activeStatuses },
        endDate: { gte: new Date() },
      },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    const blackoutDates = await this.prisma.rentalBlackoutDate.findMany({
      where: {
        listingId,
        endDate: { gte: new Date() },
      },
      select: {
        startDate: true,
        endDate: true,
        reason: true,
      },
    });

    return {
      bookedRanges: bookings.map((b) => ({
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
      })),
      blackoutRanges: blackoutDates.map((b) => ({
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
        reason: b.reason,
      })),
    };
  }

  // Get rental orders for a user (as renter or seller)
  async findByUser(userId: string, role: 'renter' | 'seller', status?: string) {
    const where: Prisma.RentalOrderWhereInput = role === 'renter' ? { renterId: userId } : { sellerId: userId };

    if (status && status !== 'all') {
      where.status = status as any;
    }

    return this.prisma.rentalOrder.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            rentalPricePerDay: true,
            rentalDeposit: true,
            rentalPickupLocation: true,
            rentalNotes: true,
            attributes: true,
            images: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        renter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        extensions: {
          orderBy: { createdAt: 'desc' },
        },
        conversationsAsRental: {
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHistory(data: {
    rentalOrderId: string;
    actorId: string;
    action: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    notes?: string | null;
    metadata?: any;
  }) {
    const createData: Prisma.RentalHistoryCreateInput = {
      rentalOrder: { connect: { id: data.rentalOrderId } },
      actor: { connect: { id: data.actorId } },
      action: data.action,
    };
    if (data.fromStatus !== undefined) createData.fromStatus = data.fromStatus;
    if (data.toStatus !== undefined) createData.toStatus = data.toStatus;
    if (data.notes !== undefined) createData.notes = data.notes;
    if (data.metadata !== undefined) createData.metadata = data.metadata;

    return this.prisma.rentalHistory.create({
      data: createData,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // Extension methods
  async createExtension(data: Prisma.RentalExtensionCreateInput) {
    return this.prisma.rentalExtension.create({
      data,
      include: {
        rentalOrder: true,
        requestedByUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async updateExtension(id: string, data: Prisma.RentalExtensionUpdateInput) {
    return this.prisma.rentalExtension.update({
      where: { id },
      data,
      include: {
        rentalOrder: true,
      },
    });
  }

  async findExtensionsByRentalOrder(rentalOrderId: string) {
    return this.prisma.rentalExtension.findMany({
      where: { rentalOrderId },
      orderBy: { createdAt: 'desc' },
      include: {
        requestedByUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  // Condition Log methods
  async createConditionLog(data: any) {
    return this.prisma.rentalConditionLog.create({
      data,
      include: {
        booking: {
          select: {
            id: true,
            orderNumber: true,
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        loggedByUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async findConditionLogsByBooking(bookingId: string) {
    return this.prisma.rentalConditionLog.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
      include: {
        loggedByUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  // Blackout Date methods
  async createBlackoutDate(data: any) {
    return this.prisma.rentalBlackoutDate.create({
      data,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async findBlackoutDatesByListing(listingId: string) {
    return this.prisma.rentalBlackoutDate.findMany({
      where: { listingId },
      orderBy: { startDate: 'asc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async deleteBlackoutDate(id: string, userId: string) {
    return this.prisma.rentalBlackoutDate.deleteMany({
      where: {
        id,
        createdByUserId: userId,
      },
    });
  }

  // Cancel concurrent pending requests when a booking is approved/accepted
  async cancelConcurrentPendingRequests(listingId: string, startDate: Date, endDate: Date, approvedBookingId: string) {
    return this.prisma.rentalOrder.updateMany({
      where: {
        listingId,
        status: { in: ['PENDING', 'REQUESTED'] },
        id: { not: approvedBookingId },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      data: {
        status: 'DECLINED',
        cancellationReason: 'Automatically declined due to conflicting accepted booking',
        declineReason: 'Dates no longer available',
      },
    });
  }
}

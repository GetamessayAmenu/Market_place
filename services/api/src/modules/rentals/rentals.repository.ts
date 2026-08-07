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
            images: true,
          },
        },
        renter: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        extensions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.rentalOrder.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
            rentalPricePerDay: true,
            rentalDeposit: true,
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
      },
    });
  }

  async count(where?: Prisma.RentalOrderWhereInput) {
    if (where) {
      return this.prisma.rentalOrder.count({ where });
    }
    return this.prisma.rentalOrder.count();
  }

  // Check availability for a listing during a date range
  async checkAvailability(
    listingId: string,
    startDate: Date,
    endDate: Date,
    excludeOrderId?: string,
  ) {
    const where: Prisma.RentalOrderWhereInput = {
      listingId,
      status: {
        in: ['APPROVED', 'HANDOVER_PENDING', 'ACTIVE'],
      },
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    };

    if (excludeOrderId) {
      where.id = { not: excludeOrderId };
    }

    const conflictingOrders = await this.prisma.rentalOrder.findMany({
      where,
    });

    if (conflictingOrders.length > 0) {
      return false;
    }

    // Check blackout dates
    const conflictingBlackoutDates = await this.prisma.rentalBlackoutDate.findMany({
      where: {
        listingId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    return conflictingBlackoutDates.length === 0;
  }

  // Get rental orders for a user (as renter or seller)
  async findByUser(userId: string, role: 'renter' | 'seller') {
    return this.prisma.rentalOrder.findMany({
      where: role === 'renter' ? { renterId: userId } : { sellerId: userId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
          },
        },
        extensions: true,
      },
      orderBy: { createdAt: 'desc' },
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

  // Cancel concurrent pending requests when a booking is approved
  async cancelConcurrentPendingRequests(listingId: string, startDate: Date, endDate: Date, approvedBookingId: string) {
    return this.prisma.rentalOrder.updateMany({
      where: {
        listingId,
        status: 'REQUESTED',
        id: { not: approvedBookingId },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      data: {
        status: 'DECLINED',
        cancellationReason: 'Automatically declined due to conflicting approved booking',
      },
    });
  }
}

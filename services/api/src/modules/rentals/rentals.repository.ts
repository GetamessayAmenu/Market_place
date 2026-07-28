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
    return this.prisma.rentalOrder.count({ where });
  }

  // Check availability for a listing during a date range
  async checkAvailability(
    listingId: string,
    startDate: Date,
    endDate: Date,
    excludeOrderId?: string,
  ) {
    const conflictingOrders = await this.prisma.rentalOrder.findMany({
      where: {
        listingId,
        status: {
          in: ['APPROVED', 'HANDOVER_PENDING', 'ACTIVE'],
        },
        id: excludeOrderId ? { not: excludeOrderId } : undefined,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    return conflictingOrders.length === 0;
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
}

import { Injectable } from '@nestjs/common';
import type { CustomOrder, CustomOrderStatus, Prisma } from '@prisma/client';

import {
  BaseRepository,
  type PrismaModelDelegate,
} from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

import type { CustomOrderWithRelations } from './serializers/custom-order.serializer';

const customOrderInclude = {
  listing: { select: { id: true, title: true, slug: true } },
  buyer: { select: { id: true, displayName: true, avatarUrl: true } },
  seller: { select: { id: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.CustomOrderInclude;

@Injectable()
export class CustomOrdersRepository extends BaseRepository<CustomOrder> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.customOrder as unknown as PrismaModelDelegate);
  }

  async findByIdWithRelations(id: string): Promise<CustomOrderWithRelations | null> {
    return this.prisma.customOrder.findFirst({
      where: { id },
      include: customOrderInclude,
    });
  }

  async createOrder(data: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    measurements?: Prisma.InputJsonValue;
    fabricChoice?: string;
    colorChoice?: string;
    designNotes?: string;
    referenceImages?: string[];
    estimatedPrice?: Prisma.Decimal;
    estimatedDays?: number;
  }): Promise<CustomOrderWithRelations> {
    return this.prisma.customOrder.create({
      data: {
        listingId: data.listingId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        ...(data.measurements !== undefined ? { measurements: data.measurements } : {}),
        ...(data.fabricChoice !== undefined ? { fabricChoice: data.fabricChoice } : {}),
        ...(data.colorChoice !== undefined ? { colorChoice: data.colorChoice } : {}),
        ...(data.designNotes !== undefined ? { designNotes: data.designNotes } : {}),
        ...(data.referenceImages !== undefined ? { referenceImages: data.referenceImages } : {}),
        ...(data.estimatedPrice !== undefined ? { estimatedPrice: data.estimatedPrice } : {}),
        ...(data.estimatedDays !== undefined ? { estimatedDays: data.estimatedDays } : {}),
      },
      include: customOrderInclude,
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: CustomOrderStatus;
      finalPrice?: Prisma.Decimal;
      cancelledReason?: string;
    },
  ): Promise<CustomOrderWithRelations> {
    return this.prisma.customOrder.update({
      where: { id },
      data,
      include: customOrderInclude,
    });
  }

  async findByBuyer(
    buyerId: string,
    params: { page: number; limit: number; status?: CustomOrderStatus },
  ): Promise<{ items: CustomOrderWithRelations[]; total: number; page: number; limit: number }> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CustomOrderWhereInput = {
      buyerId,
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.customOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: customOrderInclude,
      }),
      this.prisma.customOrder.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findBySeller(
    sellerId: string,
    params: { page: number; limit: number; status?: CustomOrderStatus },
  ): Promise<{ items: CustomOrderWithRelations[]; total: number; page: number; limit: number }> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CustomOrderWhereInput = {
      sellerId,
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.customOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: customOrderInclude,
      }),
      this.prisma.customOrder.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}

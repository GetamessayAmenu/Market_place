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
    selectedSize?: string;
    measurements?: Prisma.InputJsonValue;
    selectedFabric?: string;
    selectedColor?: string;
    embroideryNotes?: string;
    inspirationImages?: string[];
    buyerNotes?: string;
    agreedPrice?: Prisma.Decimal;
  }): Promise<CustomOrderWithRelations> {
    // Find or create conversation for this listing and buyer/seller pair
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        listingId_buyerId_sellerId: {
          listingId: data.listingId,
          buyerId: data.buyerId,
          sellerId: data.sellerId,
        },
      },
    });

    let conversationId = conversation?.id;

    if (!conversationId) {
      const newConversation = await this.prisma.conversation.create({
        data: {
          listingId: data.listingId,
          buyerId: data.buyerId,
          sellerId: data.sellerId,
        },
      });
      conversationId = newConversation.id;
    }

    return this.prisma.customOrder.create({
      data: {
        listingId: data.listingId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        conversationId,
        ...(data.selectedSize !== undefined ? { selectedSize: data.selectedSize } : {}),
        ...(data.measurements !== undefined ? { measurements: data.measurements } : {}),
        ...(data.selectedFabric !== undefined ? { selectedFabric: data.selectedFabric } : {}),
        ...(data.selectedColor !== undefined ? { selectedColor: data.selectedColor } : {}),
        ...(data.embroideryNotes !== undefined ? { embroideryNotes: data.embroideryNotes } : {}),
        ...(data.inspirationImages !== undefined ? { inspirationImages: data.inspirationImages } : {}),
        ...(data.buyerNotes !== undefined ? { buyerNotes: data.buyerNotes } : {}),
        ...(data.agreedPrice !== undefined ? { agreedPrice: data.agreedPrice } : {}),
      },
      include: customOrderInclude,
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: CustomOrderStatus;
      agreedPrice?: Prisma.Decimal;
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

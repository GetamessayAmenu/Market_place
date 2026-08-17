import { Injectable } from '@nestjs/common';
import type { CustomOrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { ListingsRepository } from '../listings/listings.repository';

import { CustomOrdersRepository } from './custom-orders.repository';
import type { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import type { UpdateCustomOrderStatusDto } from './dto/update-custom-order-status.dto';
import {
  CustomOrderForbiddenException,
  CustomOrderNotFoundException,
  InvalidCustomOrderStatusTransitionException,
  ListingNotCustomOrderableException,
} from './exceptions/custom-order.exceptions';
import { serializeCustomOrder } from './serializers/custom-order.serializer';

const VALID_TRANSITIONS: Record<string, CustomOrderStatus[]> = {
  submitted: ['under_review', 'cancelled'],
  under_review: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'cancelled'],
  in_production: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class CustomOrdersService {
  constructor(
    private readonly customOrdersRepository: CustomOrdersRepository,
    private readonly listingsRepository: ListingsRepository,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateCustomOrderDto) {
    const listing = await this.listingsRepository.findByIdRaw(dto.listingId);
    if (!listing || listing.deletedAt) {
      throw new ListingNotCustomOrderableException();
    }
    // Check if listing supports custom design (new unified model)
    const supportsCustomDesign = (listing as any).supportsCustomDesign ?? listing.customOrderAvailable;
    if (!supportsCustomDesign) {
      throw new ListingNotCustomOrderableException();
    }
    if (listing.sellerId === user.id) {
      throw new CustomOrderForbiddenException('Cannot order your own listing');
    }

    const order = await this.customOrdersRepository.createOrder({
      listingId: dto.listingId,
      buyerId: user.id,
      sellerId: listing.sellerId,
      ...(dto.selectedSize !== undefined ? { selectedSize: dto.selectedSize } : {}),
      ...(dto.measurements !== undefined
        ? { measurements: dto.measurements as unknown as Prisma.InputJsonValue }
        : {}),
      ...(dto.selectedFabric !== undefined ? { selectedFabric: dto.selectedFabric } : {}),
      ...(dto.selectedColor !== undefined ? { selectedColor: dto.selectedColor } : {}),
      ...(dto.embroideryNotes !== undefined ? { embroideryNotes: dto.embroideryNotes } : {}),
      ...(dto.inspirationImages !== undefined ? { inspirationImages: dto.inspirationImages } : {}),
      ...(dto.buyerNotes !== undefined ? { buyerNotes: dto.buyerNotes } : {}),
      ...(dto.agreedPrice !== undefined
        ? { agreedPrice: new Prisma.Decimal(dto.agreedPrice) }
        : {}),
    });

    return serializeCustomOrder(order);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const order = await this.customOrdersRepository.findByIdWithRelations(id);
    if (!order) throw new CustomOrderNotFoundException();
    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      throw new CustomOrderNotFoundException();
    }
    return serializeCustomOrder(order);
  }

  async findByBuyer(user: AuthenticatedUser, query: { page?: number; limit?: number; status?: CustomOrderStatus }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.customOrdersRepository.findByBuyer(user.id, {
      page,
      limit,
      ...(query.status ? { status: query.status } : {}),
    });
    return toPaginatedResponse({
      ...result,
      items: result.items.map(serializeCustomOrder),
    });
  }

  async findBySeller(user: AuthenticatedUser, query: { page?: number; limit?: number; status?: CustomOrderStatus }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.customOrdersRepository.findBySeller(user.id, {
      page,
      limit,
      ...(query.status ? { status: query.status } : {}),
    });
    return toPaginatedResponse({
      ...result,
      items: result.items.map(serializeCustomOrder),
    });
  }

  async updateStatus(id: string, user: AuthenticatedUser, dto: UpdateCustomOrderStatusDto) {
    const order = await this.customOrdersRepository.findByIdWithRelations(id);
    if (!order) throw new CustomOrderNotFoundException();

    if (order.sellerId !== user.id && order.buyerId !== user.id) {
      throw new CustomOrderNotFoundException();
    }

    // Only seller can advance status; buyer can only cancel
    if (dto.status !== 'cancelled' as CustomOrderStatus && order.sellerId !== user.id) {
      throw new CustomOrderForbiddenException('Only the seller can update order status');
    }
    if (dto.status === 'cancelled' as CustomOrderStatus && order.buyerId !== user.id && order.sellerId !== user.id) {
      throw new CustomOrderForbiddenException();
    }

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new InvalidCustomOrderStatusTransitionException(order.status, dto.status);
    }

    const updated = await this.customOrdersRepository.updateStatus(id, {
      status: dto.status,
      ...(dto.agreedPrice !== undefined
        ? { agreedPrice: new Prisma.Decimal(dto.agreedPrice) }
        : {}),
      ...(dto.cancelledReason !== undefined
        ? { cancelledReason: dto.cancelledReason }
        : {}),
    });

    return serializeCustomOrder(updated);
  }
}

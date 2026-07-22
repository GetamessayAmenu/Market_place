import { Injectable } from '@nestjs/common';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { OrdersRepository } from './orders.repository';
import { OrderQueryDto } from './dto/order-query.dto';

export interface SerializedOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly type: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly buyerId: string;
  readonly sellerId: string;
  readonly listingId: string;
  readonly totalAmount: number;
  readonly currency: string;
  readonly rentalStartDate: string | null;
  readonly rentalEndDate: string | null;
  readonly rentalDeposit: number | null;
  readonly customOrderId: string | null;
  readonly measurements: any;
  readonly fabricChoice: string | null;
  readonly colorChoice: string | null;
  readonly designNotes: string | null;
  readonly shippingAddress: any;
  readonly trackingNumber: string | null;
  readonly paymentMethod: string | null;
  readonly paymentId: string | null;
  readonly cancelledAt: string | null;
  readonly cancelledReason: string | null;
  readonly refundedAt: string | null;
  readonly refundAmount: number | null;
  readonly refundReason: string | null;
  readonly confirmedAt: string | null;
  readonly shippedAt: string | null;
  readonly deliveredAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly buyer: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    location: string | null;
  };
  readonly seller: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    location: string | null;
  };
  readonly listing: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    images: any[];
  };
  readonly customOrder?: any;
}

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async findAll(query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.type !== undefined ? { type: query.type } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.paymentStatus !== undefined ? { paymentStatus: query.paymentStatus } : {}),
      ...(query.buyerId !== undefined ? { buyerId: query.buyerId } : {}),
      ...(query.sellerId !== undefined ? { sellerId: query.sellerId } : {}),
      ...(query.search !== undefined
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: 'insensitive' as const } },
              { buyer: { displayName: { contains: query.search, mode: 'insensitive' as const } } },
              { seller: { displayName: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const orderBy = { createdAt: 'desc' as const };

    const [items, total] = await Promise.all([
      this.ordersRepository.findAll({ where, orderBy, skip, take: limit }),
      this.ordersRepository.count(where),
    ]);

    return toPaginatedResponse({
      items: items.map((order: any) => this.serializeOrder(order)),
      total,
      page,
      limit,
    });
  }

  async findOne(id: string): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    return this.serializeOrder(order);
  }

  async findByOrderNumber(orderNumber: string): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new Error('Order not found');
    }
    return this.serializeOrder(order);
  }

  private serializeOrder(order: any): SerializedOrder {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      paymentStatus: order.paymentStatus,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      listingId: order.listingId,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      rentalStartDate: order.rentalStartDate?.toISOString() ?? null,
      rentalEndDate: order.rentalEndDate?.toISOString() ?? null,
      rentalDeposit: order.rentalDeposit ? Number(order.rentalDeposit) : null,
      customOrderId: order.customOrderId ?? null,
      measurements: order.measurements,
      fabricChoice: order.fabricChoice ?? null,
      colorChoice: order.colorChoice ?? null,
      designNotes: order.designNotes ?? null,
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber ?? null,
      paymentMethod: order.paymentMethod ?? null,
      paymentId: order.paymentId ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      cancelledReason: order.cancelledReason ?? null,
      refundedAt: order.refundedAt?.toISOString() ?? null,
      refundAmount: order.refundAmount ? Number(order.refundAmount) : null,
      refundReason: order.refundReason ?? null,
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      buyer: order.buyer,
      seller: order.seller,
      listing: {
        ...order.listing,
        price: Number(order.listing.price),
      },
      customOrder: order.customOrder,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AnalyticsQueryDto, AnalyticsRange } from './dto/analytics-query.dto';

export interface KpiValue {
  current: number;
  previous: number;
  pctChange: number;
  absoluteChange: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ActivityTimeSeriesPoint {
  date: string;
  users: number;
  buyers: number;
  sellers: number;
  listings: number;
  views: number;
  contacts: number;
  orders: number;
  gmv: number;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Calculates current and prior date ranges cleanly.
   */
  calculateDateRanges(query: AnalyticsQueryDto): {
    currentFrom: Date;
    currentTo: Date;
    previousFrom: Date;
    previousTo: Date;
    days: number;
  } {
    const now = new Date();
    let currentTo = new Date(now);
    let currentFrom = new Date(now);

    const range = query.range || AnalyticsRange.THIRTY_DAYS;
    let days = 30;

    if (range === AnalyticsRange.TODAY) {
      days = 1;
      currentFrom = new Date(now.setHours(0, 0, 0, 0));
      currentTo = new Date(now.setHours(23, 59, 59, 999));
    } else if (range === AnalyticsRange.SEVEN_DAYS) {
      days = 7;
      currentFrom = new Date(currentTo.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === AnalyticsRange.NINETY_DAYS) {
      days = 90;
      currentFrom = new Date(currentTo.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === AnalyticsRange.CUSTOM && query.from) {
      currentFrom = new Date(query.from);
      currentTo = query.to ? new Date(query.to) : new Date();
      days = Math.max(1, Math.round((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      days = 30;
      currentFrom = new Date(currentTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const previousTo = new Date(currentFrom.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - days * 24 * 60 * 60 * 1000);

    return { currentFrom, currentTo, previousFrom, previousTo, days };
  }

  /**
   * Formats current vs previous values into a standardized KpiValue.
   */
  formatKpi(current: number, previous: number): KpiValue {
    const absoluteChange = current - previous;
    let pctChange = 0;
    if (previous > 0) {
      pctChange = Math.round(((current - previous) / previous) * 1000) / 10;
    } else if (current > 0) {
      pctChange = 100;
    }
    const trend = pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'neutral';
    return { current, previous, pctChange, absoluteChange, trend };
  }

  /**
   * Helper: Calculates GMV across Orders, Rentals, and Custom Orders in range
   */
  async getGmvSum(from: Date, to: Date): Promise<number> {
    const [orderSum, rentalSum, customSum] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { agreedPrice: true },
        where: { createdAt: { gte: from, lte: to }, status: { notIn: ['CANCELLED', 'DISPUTED'] } },
      }),
      this.prisma.rentalOrder.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: from, lte: to }, status: { notIn: ['CANCELLED', 'DECLINED', 'EXPIRED'] } },
      }),
      this.prisma.customOrder.aggregate({
        _sum: { agreedPrice: true },
        where: { createdAt: { gte: from, lte: to }, status: { notIn: ['cancelled'] } },
      }),
    ]);

    const salesGmv = Number(orderSum._sum.agreedPrice || 0);
    const rentalGmv = Number(rentalSum._sum.totalAmount || 0);
    const customGmv = Number(customSum._sum.agreedPrice || 0);

    return Math.round((salesGmv + rentalGmv + customGmv) * 100) / 100;
  }

  /**
   * Persists an analytics event to `analytics_events` table.
   */
  async recordEvent(data: {
    eventType: string;
    userId?: string | undefined;
    sellerId?: string | undefined;
    listingId?: string | undefined;
    categoryId?: string | undefined;
    metadata?: any;
  }) {
    return this.prisma.analyticsEvent.create({
      data: {
        eventType: data.eventType,
        userId: data.userId || null,
        sellerId: data.sellerId || null,
        listingId: data.listingId || null,
        categoryId: data.categoryId || null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }
}

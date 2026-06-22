import { Injectable } from '@nestjs/common';
import type { Prisma, Review } from '@prisma/client';

import {
  BaseRepository,
  type PrismaModelDelegate,
} from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

import type { ReviewWithRelations } from './serializers/review.serializer';

const reviewInclude = {
  reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.ReviewInclude;

@Injectable()
export class ReviewsRepository extends BaseRepository<Review> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.review as unknown as PrismaModelDelegate);
  }

  async findByListing(
    listingId: string,
    params: { page: number; limit: number },
  ): Promise<{ items: ReviewWithRelations[]; total: number; page: number; limit: number }> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = { listingId, deletedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: reviewInclude,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findBySeller(
    sellerId: string,
    params: { page: number; limit: number },
  ): Promise<{ items: ReviewWithRelations[]; total: number; page: number; limit: number }> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = { sellerId, deletedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: reviewInclude,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async createReview(data: {
    listingId: string;
    reviewerId: string;
    sellerId: string;
    rating: number;
    title?: string;
    body?: string;
    images?: string[];
  }): Promise<ReviewWithRelations> {
    return this.prisma.review.create({
      data: {
        listingId: data.listingId,
        reviewerId: data.reviewerId,
        sellerId: data.sellerId,
        rating: data.rating,
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(data.images !== undefined ? { images: data.images } : {}),
      },
      include: reviewInclude,
    });
  }

  async softDelete(id: string): Promise<Review> {
    return this.prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getListingRatingSummary(
    listingId: string,
  ): Promise<{ ratings: { rating: number }[]; distribution: { rating: number; _count: number }[] }> {
    const [ratings, distribution] = await Promise.all([
      this.prisma.review.findMany({
        where: { listingId, deletedAt: null },
        select: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { listingId, deletedAt: null },
        _count: true,
      }),
    ]);

    return {
      ratings,
      distribution: distribution.map((d) => ({ rating: d.rating, _count: d._count })),
    };
  }

  async reviewExists(reviewerId: string, listingId: string): Promise<boolean> {
    const found = await this.prisma.review.findFirst({
      where: { reviewerId, listingId, deletedAt: null },
      select: { id: true },
    });
    return found !== null;
  }
}

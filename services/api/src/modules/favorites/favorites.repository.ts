import { Injectable } from '@nestjs/common';
import type { Favorite } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class FavoritesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndListing(userId: string, listingId: string): Promise<Favorite | null> {
    return this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
  }

  async create(userId: string, listingId: string): Promise<Favorite> {
    return this.prisma.favorite.create({
      data: { userId, listingId },
    });
  }

  async remove(userId: string, listingId: string): Promise<void> {
    await this.prisma.favorite.delete({
      where: { userId_listingId: { userId, listingId } },
    });
  }

  async countForListing(listingId: string): Promise<number> {
    return this.prisma.favorite.count({ where: { listingId } });
  }

  async findPaginatedByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<readonly Favorite[]> {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.favorite.count({ where: { userId } });
  }

  async findListingIdsForUser(userId: string, listingIds: readonly string[]): Promise<string[]> {
    if (!listingIds.length) {
      return [];
    }
    const rows = await this.prisma.favorite.findMany({
      where: { userId, listingId: { in: [...listingIds] } },
      select: { listingId: true },
    });
    return rows.map((r) => r.listingId);
  }
}

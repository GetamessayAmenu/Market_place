import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

export const USER_WITH_ROLE_INCLUDE = {
  role: true,
  adminProfile: true,
  userRoles: { include: { role: true } },
} as const;

export type UserWithRole = Prisma.UserGetPayload<{
  include: typeof USER_WITH_ROLE_INCLUDE;
}>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: USER_WITH_ROLE_INCLUDE,
    });
  }

  async findActiveById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: USER_WITH_ROLE_INCLUDE,
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithRole> {
    return this.prisma.user.create({
      data,
      include: USER_WITH_ROLE_INCLUDE,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateStatus(id: string, status: 'active' | 'suspended' | 'banned'): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async findManyPaginated(params: {
    where: Prisma.UserWhereInput;
    orderBy: Prisma.UserOrderByWithRelationInput;
    page: number;
    limit: number;
  }): Promise<{ items: UserWithRole[]; total: number; page: number; limit: number }> {
    const { where, orderBy, page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: USER_WITH_ROLE_INCLUDE,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateRole(userId: string, roleId: string): Promise<UserWithRole> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: USER_WITH_ROLE_INCLUDE,
    });
  }

  async countByStatus(): Promise<Record<string, number>> {
    const [active, suspended, banned, pending] = await Promise.all([
      this.prisma.user.count({ where: { status: 'active', deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'suspended', deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'banned', deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'pending_verification', deletedAt: null } }),
    ]);
    return { active, suspended, banned, pending_verification: pending };
  }

  async updateProfile(id: string, data: Prisma.UserUpdateInput): Promise<UserWithRole> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: USER_WITH_ROLE_INCLUDE,
    });
  }

  async countActiveRentals(userId: string): Promise<number> {
    return this.prisma.rentalOrder.count({
      where: {
        OR: [{ renterId: userId }, { sellerId: userId }],
        status: { in: ['ACTIVE', 'RETURN_PENDING', 'ACCEPTED', 'READY_FOR_PICKUP'] },
      },
    });
  }

  async softDeleteSelf(id: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: now, status: 'suspended' },
      }),
      this.prisma.listing.updateMany({
        where: { sellerId: id, deletedAt: null },
        data: { deletedAt: now, status: 'archived' },
      }),
    ]);
  }

  async findProfileById(id: string): Promise<UserWithRole & { vendorKycProfile: any; _count: { listings: number; favorites: number; reportsFiled: number; notifications: number; storeFollowers: number } } | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...USER_WITH_ROLE_INCLUDE,
        vendorKycProfile: true,
        _count: {
          select: {
            listings: true,
            favorites: true,
            reportsFiled: true,
            notifications: true,
            storeFollowers: true,
          },
        },
      },
    }) as any;
  }

  async getSellerAggregates(userId: string) {
    const [reviewAgg, totalActive, forSaleCount, rentalCount, customCount] = await Promise.all([
      this.prisma.review.aggregate({
        where: { sellerId: userId, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.listing.count({
        where: {
          sellerId: userId,
          status: 'active',
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      this.prisma.listing.count({
        where: {
          sellerId: userId,
          status: 'active',
          deletedAt: null,
          availableForPurchase: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      this.prisma.listing.count({
        where: {
          sellerId: userId,
          status: 'active',
          deletedAt: null,
          availableForRent: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      this.prisma.listing.count({
        where: {
          sellerId: userId,
          status: 'active',
          deletedAt: null,
          customOrderAvailable: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
    ]);

    return {
      averageRating: reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : null,
      reviewCount: reviewAgg._count.rating || 0,
      listingCounts: {
        all: totalActive,
        buy: forSaleCount,
        rent: rentalCount,
        custom: customCount,
      },
    };
  }

  // ─── Store Follow Feature ───────────────────────────────────────────────────

  async findStoreFollow(followerId: string, storeId: string) {
    return this.prisma.storeFollow.findUnique({
      where: {
        followerId_storeId: {
          followerId,
          storeId,
        },
      },
    });
  }

  async createStoreFollow(followerId: string, storeId: string) {
    return this.prisma.storeFollow.create({
      data: {
        followerId,
        storeId,
      },
    });
  }

  async deleteStoreFollow(id: string) {
    return this.prisma.storeFollow.delete({
      where: { id },
    });
  }

  async countStoreFollowers(storeId: string) {
    return this.prisma.storeFollow.count({
      where: { storeId },
    });
  }

  async findStoreFollowsByFollower(followerId: string) {
    return this.prisma.storeFollow.findMany({
      where: { followerId },
      include: {
        store: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            location: true,
            bio: true,
            sellerType: true,
            _count: {
              select: {
                listings: true,
                storeFollowers: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStoreFollowsByStore(storeId: string) {
    return this.prisma.storeFollow.findMany({
      where: { storeId },
      include: {
        follower: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUserListings(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      type?: 'all' | 'buy' | 'rent' | 'custom';
      sortBy?: 'newest' | 'price_asc' | 'price_desc';
      isOwner?: boolean;
    } = {},
  ) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 50));
    const skip = (page - 1) * limit;

    const baseWhere: Prisma.ListingWhereInput = {
      sellerId: userId,
      deletedAt: null,
      ...(params.isOwner
        ? {}
        : {
            status: 'active',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          }),
    };

    const typeWhere: Prisma.ListingWhereInput = { ...baseWhere };
    if (params.type === 'buy') {
      typeWhere.availableForPurchase = true;
    } else if (params.type === 'rent') {
      typeWhere.availableForRent = true;
    } else if (params.type === 'custom') {
      typeWhere.customOrderAvailable = true;
    }

    let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };
    if (params.sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (params.sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    }

    const [items, total, allCount, buyCount, rentCount, customCount] = await Promise.all([
      this.prisma.listing.findMany({
        where: typeWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          currency: true,
          condition: true,
          city: true,
          state: true,
          country: true,
          status: true,
          isFeatured: true,
          rejectedReason: true,
          availableForPurchase: true,
          availableForRent: true,
          customOrderAvailable: true,
          rentalPricePerDay: true,
          rentalDeposit: true,
          supportsReadyMade: true,
          supportsCustomDesign: true,
          startingCustomPrice: true,
          createdAt: true,
          images: {
            where: { deletedAt: null },
            select: { url: true, isPrimary: true, sortOrder: true },
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where: typeWhere }),
      this.prisma.listing.count({ where: baseWhere }),
      this.prisma.listing.count({ where: { ...baseWhere, availableForPurchase: true } }),
      this.prisma.listing.count({ where: { ...baseWhere, availableForRent: true } }),
      this.prisma.listing.count({ where: { ...baseWhere, customOrderAvailable: true } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      counts: {
        all: allCount,
        buy: buyCount,
        rent: rentCount,
        custom: customCount,
      },
    };
  }
}

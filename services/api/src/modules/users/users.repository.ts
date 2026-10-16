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

  async softDeleteSelf(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'suspended' },
    });
  }

  async findProfileById(id: string): Promise<UserWithRole & { _count: { listings: number; favorites: number; reportsFiled: number; notifications: number; storeFollowers: number } } | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...USER_WITH_ROLE_INCLUDE,
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
    });
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

  async findUserListings(userId: string, isOwner = false) {
    return this.prisma.listing.findMany({
      where: {
        sellerId: userId,
        ...(isOwner ? {} : { status: 'active' }),
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        price: true,
        condition: true,
        city: true,
        status: true,
        rejectedReason: true,
        availableForPurchase: true,
        availableForRent: true,
        customOrderAvailable: true,
        rentalPricePerDay: true,
        createdAt: true,
        images: {
          where: { deletedAt: null },
          select: { url: true, isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

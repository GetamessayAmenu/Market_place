import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

export type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true };
}>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { role: true },
    });
  }

  async findActiveById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithRole> {
    return this.prisma.user.create({
      data,
      include: { role: true },
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
        include: { role: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateRole(userId: string, roleId: string): Promise<UserWithRole> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: { role: true },
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
      include: { role: true },
    });
  }

  async softDeleteSelf(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'suspended' },
    });
  }

  async findProfileById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        role: true,
        _count: {
          select: {
            listings: true,
            favorites: true,
            reportsFiled: true,
            notifications: true,
          },
        },
      },
    });
  }
}

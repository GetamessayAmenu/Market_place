import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class HeroBannersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: {
    where?: Prisma.HeroBannerWhereInput;
    orderBy?: Prisma.HeroBannerOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    const [items, total] = await Promise.all([
      this.prisma.heroBanner.findMany({
        ...args,
        include: {
          createdBy: {
            select: {
              id: true,
              displayName: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      }),
      args.where
        ? this.prisma.heroBanner.count({ where: args.where })
        : this.prisma.heroBanner.count(),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    if (!id || !UUID_REGEX.test(id)) return null;
    return this.prisma.heroBanner.findUnique({
      where: { id },
      include: {
        createdBy: true,
        updatedBy: true,
      },
    });
  }

  async create(data: Prisma.HeroBannerCreateInput) {
    return this.prisma.heroBanner.create({
      data,
      include: {
        createdBy: true,
      },
    });
  }

  async update(id: string, data: Prisma.HeroBannerUpdateInput) {
    return this.prisma.heroBanner.update({
      where: { id },
      data,
      include: {
        createdBy: true,
        updatedBy: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.heroBanner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(where?: Prisma.HeroBannerWhereInput) {
    return where
      ? this.prisma.heroBanner.count({ where })
      : this.prisma.heroBanner.count();
  }

  async getActiveBanners(currentDate: Date = new Date()) {
    return this.prisma.heroBanner.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        AND: [
          {
            OR: [
              {
                publishAt: null,
                unpublishAt: null,
              },
              {
                publishAt: { lte: currentDate },
                unpublishAt: { gte: currentDate },
              },
              {
                publishAt: { lte: currentDate },
                unpublishAt: null,
              },
            ],
          },
          {
            OR: [
              {
                holidayTheme: null,
              },
              {
                themeStartDate: { lte: currentDate },
                themeEndDate: { gte: currentDate },
              },
            ],
          },
        ],
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async getByHolidayTheme(theme: string) {
    return this.prisma.heroBanner.findMany({
      where: {
        holidayTheme: theme as any,
        status: 'published',
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findUserById(id: string) {
    if (!id || !UUID_REGEX.test(id)) return null;
    try {
      return await this.prisma.user.findUnique({ where: { id } });
    } catch {
      return null;
    }
  }

  async findFirstAdminUser() {
    return this.prisma.user.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }
}

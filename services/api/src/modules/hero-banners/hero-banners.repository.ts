import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

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
      this.prisma.heroBanner.count({ where: args.where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
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
    return this.prisma.heroBanner.count({ where });
  }

  // Get active banners for current date (considering holiday themes)
  async getActiveBanners(currentDate: Date = new Date()) {
    return this.prisma.heroBanner.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        AND: [
          {
            OR: [
              {
                // Always active (no schedule)
                publishAt: null,
                unpublishAt: null,
              },
              {
                // Within publish window
                publishAt: { lte: currentDate },
                unpublishAt: { gte: currentDate },
              },
              {
                // Published but no unpublish date
                publishAt: { lte: currentDate },
                unpublishAt: null,
              },
            ],
          },
          {
            OR: [
              {
                // No holiday theme (always show)
                holidayTheme: null,
              },
              {
                // Within holiday theme window
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

  // Get banners by holiday theme
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
}

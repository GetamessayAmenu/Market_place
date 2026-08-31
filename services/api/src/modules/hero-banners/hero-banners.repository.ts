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
    try {
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
        this.prisma.heroBanner.count(args.where ? { where: args.where } : undefined),
      ]);

      return { items: items || [], total: total || 0 };
    } catch (err) {
      console.warn('HeroBannersRepository.findMany main query failed, trying raw query fallback:', err);
      try {
        const [items, total] = await Promise.all([
          this.prisma.heroBanner.findMany({ ...args }),
          this.prisma.heroBanner.count(args.where ? { where: args.where } : undefined),
        ]);
        return { items: items || [], total: total || 0 };
      } catch (fallbackErr) {
        console.error('HeroBannersRepository.findMany fallback failed:', fallbackErr);
        return { items: [], total: 0 };
      }
    }
  }

  async findById(id: string) {
    if (!id || !UUID_REGEX.test(id)) return null;
    try {
      return await this.prisma.heroBanner.findUnique({
        where: { id },
        include: {
          createdBy: true,
          updatedBy: true,
        },
      });
    } catch {
      return await this.prisma.heroBanner.findUnique({ where: { id } });
    }
  }

  async create(data: Prisma.HeroBannerCreateInput) {
    return this.prisma.heroBanner.create({
      data,
    });
  }

  async update(id: string, data: Prisma.HeroBannerUpdateInput) {
    return this.prisma.heroBanner.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.heroBanner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(where?: Prisma.HeroBannerWhereInput) {
    try {
      return await this.prisma.heroBanner.count(where ? { where } : undefined);
    } catch {
      return 0;
    }
  }

  async getActiveBanners() {
    try {
      return await this.prisma.heroBanner.findMany({
        where: {
          status: 'published',
          deletedAt: null,
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    } catch (err) {
      console.error('HeroBannersRepository.getActiveBanners error:', err);
      return [];
    }
  }

  async getByHolidayTheme(theme: string) {
    try {
      return await this.prisma.heroBanner.findMany({
        where: {
          holidayTheme: theme as any,
          status: 'published',
          deletedAt: null,
        },
        orderBy: { sortOrder: 'asc' },
      });
    } catch {
      return [];
    }
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
    try {
      return await this.prisma.user.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
    } catch {
      return null;
    }
  }
}

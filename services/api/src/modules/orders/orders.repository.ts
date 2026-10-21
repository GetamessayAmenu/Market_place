import { Injectable } from '@nestjs/common';

import {
  BaseRepository,
  type PrismaModelDelegate,
} from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class OrdersRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
    super(prisma, (prisma as any).order as unknown as PrismaModelDelegate);
  }

  async findAll(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }) {
    const { where, orderBy, skip, take } = params;
    return (this.prisma as any).order.findMany({
      ...(where !== undefined ? { where } : {}),
      ...(orderBy !== undefined ? { orderBy } : {}),
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            location: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            location: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            images: {
              where: { deletedAt: null },
              take: 1,
              orderBy: { isPrimary: 'desc' },
            },
          },
        },
        conversation: true,
        customQuotes: true,
      },
    });
  }

  async count(where?: any): Promise<number> {
    if (where !== undefined) {
      return (this.prisma as any).order.count({ where });
    }
    return (this.prisma as any).order.count();
  }

  async findById(id: string): Promise<any | null> {
    if (!id || typeof id !== 'string') return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return null;

    return (this.prisma as any).order.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            location: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            location: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            images: {
              where: { deletedAt: null },
              orderBy: { isPrimary: 'desc' },
            },
          },
        },
        conversation: true,
        customQuotes: true,
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<any | null> {
    return (this.prisma as any).order.findUnique({
      where: { orderNumber },
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            location: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            location: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            images: {
              where: { deletedAt: null },
              orderBy: { isPrimary: 'desc' },
            },
          },
        },
        conversation: true,
        customQuotes: true,
      },
    });
  }

  async create(data: any): Promise<any> {
    return (this.prisma as any).order.create({ data });
  }

  async update(id: string, data: any): Promise<any> {
    return (this.prisma as any).order.update({ where: { id }, data });
  }
}

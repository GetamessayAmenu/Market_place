import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class HomepageContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    where?: Prisma.HomepageContentWhereInput;
    orderBy?: Prisma.HomepageContentOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    const { where, orderBy, skip, take } = params;
    const findManyParams: any = { skip, take };
    if (where) findManyParams.where = where;
    if (orderBy) findManyParams.orderBy = orderBy;

    return this.prisma.homepageContent.findMany(findManyParams);
  }

  async count(where?: Prisma.HomepageContentWhereInput) {
    const countParams: any = {};
    if (where) countParams.where = where;
    return this.prisma.homepageContent.count(countParams);
  }

  async findById(id: string) {
    return this.prisma.homepageContent.findUnique({
      where: { id },
      include: {
        featuredListing: {
          include: {
            seller: {
              select: {
                id: true,
                displayName: true,
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        featuredCategory: true,
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.HomepageContentCreateInput) {
    return this.prisma.homepageContent.create({
      data,
      include: {
        featuredListing: true,
        featuredCategory: true,
      },
    });
  }

  async update(id: string, data: Prisma.HomepageContentUpdateInput) {
    return this.prisma.homepageContent.update({
      where: { id },
      data,
      include: {
        featuredListing: true,
        featuredCategory: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.homepageContent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.homepageContent.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async reorderItems(itemIds: string[]) {
    return this.prisma.$transaction(
      itemIds.map((id, index) =>
        this.prisma.homepageContent.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  async getPublishedContent() {
    const now = new Date();
    return this.prisma.homepageContent.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        OR: [
          { publishAt: null },
          { publishAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { unpublishAt: null },
              { unpublishAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        featuredListing: {
          include: {
            seller: {
              select: {
                id: true,
                displayName: true,
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        featuredCategory: true,
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import type { Listing, ListingStatus, Prisma } from '@prisma/client';

import {
  BaseRepository,
  type PrismaModelDelegate,
} from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ListingWithRelations } from './interfaces/listing-with-relations.interface';

const listingInclude = {
  images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  category: { select: { id: true, name: true, slug: true, parentId: true } },
  seller: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      phone: true,
      location: true,
      createdAt: true,
    },
  },
  _count: { select: { favorites: true } },
} satisfies Prisma.ListingInclude;

export interface CreateListingData {
  readonly sellerId: string;
  readonly categoryId: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly price: Prisma.Decimal;
  readonly currency: string;
  readonly condition: Prisma.ListingCreateInput['condition'];
  readonly status: ListingStatus;
  readonly city?: string;
  readonly state?: string;
  readonly country?: string;
  readonly latitude?: Prisma.Decimal;
  readonly longitude?: Prisma.Decimal;
  readonly contactOptions?: Prisma.InputJsonValue;
  readonly availableForPurchase?: boolean;
  readonly availableForRent?: boolean;
  readonly customOrderAvailable?: boolean;
  readonly rentalPricePerDay?: Prisma.Decimal;
  readonly rentalDeposit?: Prisma.Decimal;
  readonly attributes?: Prisma.InputJsonValue;
  readonly publishedAt?: Date;
  readonly expiresAt?: Date;
  readonly images: readonly {
    url: string;
    cloudinaryPublicId: string;
    sortOrder: number;
    isPrimary: boolean;
  }[];
}

@Injectable()
export class ListingsRepository extends BaseRepository<Listing> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.listing as unknown as PrismaModelDelegate);
  }

  async findByIdWithRelations(id: string): Promise<ListingWithRelations | null> {
    const result = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: listingInclude,
    });
    return result as ListingWithRelations | null;
  }

  async findBySlug(slug: string): Promise<ListingWithRelations | null> {
    const result = await this.prisma.listing.findFirst({
      where: { slug, deletedAt: null },
      include: listingInclude,
    });
    return result as ListingWithRelations | null;
  }

  async findByIdRaw(id: string): Promise<Listing | null> {
    return this.prisma.listing.findUnique({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Listing[]> {
    return this.prisma.listing.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const found = await this.prisma.listing.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return found !== null;
  }

  async createWithImages(data: CreateListingData): Promise<ListingWithRelations> {
    const { images, ...listingData } = data;
    const created = await this.prisma.listing.create({
      data: {
        ...listingData,
        images: {
          create: images.map((img) => ({
            url: img.url,
            cloudinaryPublicId: img.cloudinaryPublicId,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        },
      },
      include: listingInclude,
    });
    return created as ListingWithRelations;
  }

  async updateListing(
    id: string,
    data: Prisma.ListingUpdateInput,
  ): Promise<ListingWithRelations> {
    const updated = await this.prisma.listing.update({
      where: { id },
      data,
      include: listingInclude,
    });
    return updated as ListingWithRelations;
  }

  async replaceImages(
    listingId: string,
    images: readonly {
      url: string;
      cloudinaryPublicId: string;
      sortOrder: number;
      isPrimary: boolean;
    }[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.listingImage.updateMany({
        where: { listingId, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.listingImage.createMany({
        data: images.map((img) => ({
          listingId,
          url: img.url,
          cloudinaryPublicId: img.cloudinaryPublicId,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })),
      }),
    ]);
  }

  async softDelete(id: string): Promise<Listing> {
    return this.prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'archived' },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.listing.delete({ where: { id } });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async findManyWithRelations(params: {
    where: Prisma.ListingWhereInput;
    orderBy: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[];
    page: number;
    limit: number;
  }): Promise<{ items: ListingWithRelations[]; total: number; page: number; limit: number }> {
    const { where, orderBy, page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: listingInclude,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items as ListingWithRelations[],
      total,
      page,
      limit,
    };
  }

  async getImagePublicIds(listingId: string): Promise<string[]> {
    const images = await this.prisma.listingImage.findMany({
      where: { listingId, deletedAt: null },
      select: { cloudinaryPublicId: true },
    });
    return images.map((i) => i.cloudinaryPublicId);
  }

  async findExpiredActive(batchSize: number): Promise<readonly Pick<Listing, 'id'>[]> {
    return this.prisma.listing.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        expiresAt: { lt: new Date() },
      },
      select: { id: true },
      take: batchSize,
    });
  }
}

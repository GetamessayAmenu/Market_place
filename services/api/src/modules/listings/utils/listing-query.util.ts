import type { Prisma } from '@prisma/client';

import type { ListingQueryDto } from '../dto/listing-query.dto';

export function buildListingOrderBy(
  sortBy: ListingQueryDto['sortBy'],
): Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] {
  switch (sortBy) {
    case 'oldest':
      return { createdAt: 'asc' };
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'newest':
    default:
      return [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
  }
}

export function buildListingWhere(
  query: ListingQueryDto,
  options?: { readonly publicOnly?: boolean; readonly sellerId?: string },
): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    deletedAt: null,
  };

  if (options?.publicOnly) {
    where.status = 'active';
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  } else if (query.status) {
    where.status = query.status;
  }

  if (options?.sellerId) {
    where.sellerId = options.sellerId;
  } else if (query.sellerId) {
    where.sellerId = query.sellerId;
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.categorySlug) {
    where.category = { slug: query.categorySlug, deletedAt: null };
  }

  if (query.city) {
    where.city = { equals: query.city, mode: 'insensitive' };
  }

  if (query.condition) {
    where.condition = query.condition;
  }

  if (query.featured === true) {
    where.isFeatured = true;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) {
      where.price.gte = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      where.price.lte = query.maxPrice;
    }
  }

  if (query.sellerVerified === true) {
    where.seller = {
      OR: [{ emailVerifiedAt: { not: null } }, { phoneVerifiedAt: { not: null } }],
    };
  }

  if (query.search?.trim()) {
    const term = query.search.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
    ];
  }

  return where;
}

import type { ListingContactOptions } from '@marketplace/types';
import type { Prisma } from '@prisma/client';

import type { ListingWithRelations } from '../interfaces/listing-with-relations.interface';

export interface SerializedListingImage {
  readonly id: string;
  readonly url: string;
  readonly cloudinaryPublicId: string;
  readonly sortOrder: number;
  readonly isPrimary: boolean;
}

export interface SerializedListingSeller {
  readonly id: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly isEmailVerified: boolean;
  readonly isPhoneVerified: boolean;
}

export interface SerializedListingCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly parentId: string | null;
}

export interface SerializedListing {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly price: number;
  readonly currency: string;
  readonly condition: string;
  readonly status: string;
  readonly city: string | null;
  readonly state: string | null;
  readonly country: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly viewCount: number;
  readonly favoritesCount: number;
  readonly isFeatured: boolean;
  readonly contactOptions: ListingContactOptions | null;
  readonly availableForPurchase: boolean;
  readonly availableForRent: boolean;
  readonly customOrderAvailable: boolean;
  readonly supportsReadyMade: boolean;
  readonly supportsCustomDesign: boolean;
  readonly startingCustomPrice: number | null;
  readonly estimatedProductionDays: number | null;
  readonly rentalPricePerDay: number | null;
  readonly rentalDeposit: number | null;
  readonly attributes: Record<string, unknown> | null;
  readonly publishedAt: string | null;
  readonly expiresAt: string | null;
  readonly rejectedReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly seller: SerializedListingSeller;
  readonly category: SerializedListingCategory;
  readonly images: readonly SerializedListingImage[];
  readonly isFavorited?: boolean;
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }
  return Number(value);
}

function parseContactOptions(value: unknown): ListingContactOptions | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value;
}

function parseAttributes(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export function serializeListing(
  listing: ListingWithRelations,
  options?: { readonly isFavorited?: boolean },
): SerializedListing {
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    description: listing.description,
    price: Number(listing.price),
    currency: listing.currency,
    condition: listing.condition,
    status: listing.status,
    city: listing.city,
    state: listing.state,
    country: listing.country,
    latitude: decimalToNumber(listing.latitude),
    longitude: decimalToNumber(listing.longitude),
    viewCount: listing.viewCount,
    favoritesCount: listing._count?.favorites ?? 0,
    isFeatured: listing.isFeatured,
    contactOptions: parseContactOptions(listing.contactOptions),
    availableForPurchase: listing.availableForPurchase,
    availableForRent: listing.availableForRent,
    customOrderAvailable: listing.customOrderAvailable,
    supportsReadyMade: listing.supportsReadyMade ?? true,
    supportsCustomDesign: listing.supportsCustomDesign ?? false,
    startingCustomPrice: decimalToNumber(listing.startingCustomPrice),
    estimatedProductionDays: listing.estimatedProductionDays,
    rentalPricePerDay: decimalToNumber(listing.rentalPricePerDay),
    rentalDeposit: decimalToNumber(listing.rentalDeposit),
    attributes: parseAttributes(listing.attributes),
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    expiresAt: listing.expiresAt?.toISOString() ?? null,
    rejectedReason: listing.rejectedReason,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    seller: {
      id: listing.seller.id,
      displayName: listing.seller.displayName,
      avatarUrl: listing.seller.avatarUrl,
      isEmailVerified: listing.seller.emailVerifiedAt !== null,
      isPhoneVerified: listing.seller.phoneVerifiedAt !== null,
    },
    category: {
      id: listing.category.id,
      name: listing.category.name,
      slug: listing.category.slug,
      parentId: listing.category.parentId,
    },
    images: listing.images
      .filter((img) => img.deletedAt === null)
      .map((img) => ({
        id: img.id,
        url: img.url,
        cloudinaryPublicId: img.cloudinaryPublicId,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
    ...(options?.isFavorited !== undefined ? { isFavorited: options.isFavorited } : {}),
  };
}

export function serializeListingSummary(
  listing: ListingWithRelations,
): Pick<
  SerializedListing,
  | 'id'
  | 'title'
  | 'slug'
  | 'price'
  | 'currency'
  | 'condition'
  | 'status'
  | 'city'
  | 'viewCount'
  | 'favoritesCount'
  | 'isFeatured'
  | 'publishedAt'
  | 'images'
  | 'seller'
  | 'category'
  | 'isFavorited'
  | 'availableForPurchase'
  | 'availableForRent'
  | 'customOrderAvailable'
  | 'supportsReadyMade'
  | 'supportsCustomDesign'
  | 'rentalPricePerDay'
  | 'rentalDeposit'
  | 'rejectedReason'
> {
  const full = serializeListing(listing);
  return {
    id: full.id,
    title: full.title,
    slug: full.slug,
    price: full.price,
    currency: full.currency,
    condition: full.condition,
    status: full.status,
    city: full.city,
    viewCount: full.viewCount,
    favoritesCount: full.favoritesCount,
    isFeatured: full.isFeatured,
    publishedAt: full.publishedAt,
    images: full.images,
    seller: full.seller,
    category: full.category,
    availableForPurchase: full.availableForPurchase,
    availableForRent: full.availableForRent,
    customOrderAvailable: full.customOrderAvailable,
    supportsReadyMade: full.supportsReadyMade,
    supportsCustomDesign: full.supportsCustomDesign,
    rentalPricePerDay: full.rentalPricePerDay,
    rentalDeposit: full.rentalDeposit,
    rejectedReason: full.rejectedReason,
  };
}

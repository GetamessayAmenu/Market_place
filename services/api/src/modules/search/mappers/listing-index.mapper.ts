import type { Category } from '@prisma/client';

import type { ListingWithRelations } from '../../listings/interfaces/listing-with-relations.interface';
import type { ListingSearchDocument } from '../interfaces/listing-search-document.interface';

export function isListingSearchable(listing: {
  readonly status: string;
  readonly deletedAt: Date | null;
  readonly expiresAt: Date | null;
}): boolean {
  if (listing.deletedAt) {
    return false;
  }
  if (listing.status !== 'active') {
    return false;
  }
  if (listing.expiresAt && listing.expiresAt <= new Date()) {
    return false;
  }
  return true;
}

export function toListingSearchDocument(
  listing: ListingWithRelations,
  parentCategory: Category | null,
): ListingSearchDocument {
  const isSubcategory = listing.category.parentId !== null;
  const primaryImage = listing.images.find((img) => img.isPrimary) ?? listing.images[0];

  const locationParts = [listing.city, listing.state, listing.country].filter(
    (part): part is string => Boolean(part),
  );

  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    description: listing.description,
    categoryId: isSubcategory ? listing.category.parentId! : listing.category.id,
    categorySlug: isSubcategory ? (parentCategory?.slug ?? listing.category.slug) : listing.category.slug,
    categoryName: isSubcategory ? (parentCategory?.name ?? listing.category.name) : listing.category.name,
    subcategoryId: isSubcategory ? listing.category.id : null,
    subcategorySlug: isSubcategory ? listing.category.slug : null,
    subcategoryName: isSubcategory ? listing.category.name : null,
    city: listing.city,
    location: locationParts.length > 0 ? locationParts.join(', ') : null,
    condition: listing.condition,
    price: Number(listing.price),
    verified:
      listing.seller.emailVerifiedAt !== null ||
      listing.seller.phoneVerifiedAt !== null,
    featured: listing.isFeatured,
    status: listing.status,
    createdAt: listing.createdAt.getTime(),
    primaryImageUrl: primaryImage?.url ?? null,
    supportsReadyMade: (listing as any).supportsReadyMade ?? true,
    supportsCustomDesign: (listing as any).supportsCustomDesign ?? false,
    startingCustomPrice: (listing as any).startingCustomPrice ? Number((listing as any).startingCustomPrice) : null,
    availableForRent: (listing as any).availableForRent ?? false,
    rentalPricePerDay: (listing as any).rentalPricePerDay ? Number((listing as any).rentalPricePerDay) : null,
    regionalHubId: (listing as any).regionalHubId ?? null,
    hubType: (listing as any).hubType ?? null,
    weavingPatterns: (listing as any).weavingPatterns ?? [],
    fabricTypes: (listing as any).fabricTypes ?? [],
    embroideryStyles: (listing as any).embroideryStyles ?? [],
    occasionTypes: (listing as any).occasionTypes ?? [],
    verifiedDesigner: (listing as any).verifiedDesigner ?? false,
    rentalBlackoutDates: (listing as any).rentalBlackoutDates ?? [],
  };
}

export function documentToSearchHit(
  doc: ListingSearchDocument,
): import('../interfaces/search-result.interface').SearchListingHit {
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    price: doc.price,
    condition: doc.condition,
    status: doc.status,
    city: doc.city,
    location: doc.location,
    categoryId: doc.categoryId,
    categorySlug: doc.categorySlug,
    categoryName: doc.categoryName,
    subcategorySlug: doc.subcategorySlug,
    subcategoryName: doc.subcategoryName,
    verified: doc.verified,
    featured: doc.featured,
    createdAt: doc.createdAt,
    primaryImageUrl: doc.primaryImageUrl,
    supportsReadyMade: doc.supportsReadyMade,
    supportsCustomDesign: doc.supportsCustomDesign,
    startingCustomPrice: doc.startingCustomPrice,
  };
}

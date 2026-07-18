import type { Category, Listing, ListingImage, Prisma, User } from '@prisma/client';

export type ListingImageRecord = ListingImage;

export type ListingWithRelations = Listing & {
  readonly images: readonly ListingImageRecord[];
  readonly category: Pick<Category, 'id' | 'name' | 'slug' | 'parentId'>;
  readonly seller: Pick<
    User,
    'id' | 'displayName' | 'avatarUrl' | 'emailVerifiedAt' | 'phoneVerifiedAt' | 'phone' | 'location' | 'createdAt'
  >;
  readonly _count?: { readonly favorites: number };
};

export type ListingFindManyArgs = {
  readonly where?: Prisma.ListingWhereInput;
  readonly orderBy?: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[];
  readonly page: number;
  readonly limit: number;
};

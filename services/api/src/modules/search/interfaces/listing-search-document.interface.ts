/** Meilisearch document shape for the listings index. */
export interface ListingSearchDocument extends Record<string, unknown> {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly categoryId: string;
  readonly categorySlug: string;
  readonly categoryName: string;
  readonly subcategoryId: string | null;
  readonly subcategorySlug: string | null;
  readonly subcategoryName: string | null;
  readonly city: string | null;
  readonly location: string | null;
  readonly condition: string;
  readonly price: number;
  readonly verified: boolean;
  readonly featured: boolean;
  readonly status: string;
  readonly createdAt: number;
  readonly primaryImageUrl: string | null;
  readonly supportsReadyMade: boolean;
  readonly supportsCustomDesign: boolean;
  readonly startingCustomPrice: number | null;
}

export interface SearchIndexJobPayload {
  readonly listingId: string;
  readonly action: 'upsert' | 'delete';
}

export interface SearchListingHit {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly price: number;
  readonly condition: string;
  readonly status: string;
  readonly city: string | null;
  readonly location: string | null;
  readonly categoryId: string;
  readonly categorySlug: string;
  readonly categoryName: string;
  readonly subcategorySlug: string | null;
  readonly subcategoryName: string | null;
  readonly verified: boolean;
  readonly featured: boolean;
  readonly createdAt: number;
  readonly primaryImageUrl: string | null;
  readonly supportsReadyMade: boolean;
  readonly supportsCustomDesign: boolean;
  readonly startingCustomPrice: number | null;
}

export interface SearchSuggestionHit {
  readonly id: string;
  readonly title: string;
  readonly categoryName: string;
  readonly city: string | null;
}

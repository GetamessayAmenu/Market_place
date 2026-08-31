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
  readonly availableForRent: boolean;
  readonly rentalPricePerDay: number | null;
  readonly verifiedDesigner: boolean;
}

export interface SearchSuggestionProduct {
  readonly id: string;
  readonly title: string;
  readonly categoryName: string;
  readonly city: string | null;
  readonly primaryImageUrl: string | null;
  readonly price: number;
}

export interface SearchSuggestionCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface SearchSuggestionSeller {
  readonly id: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly location: string | null;
}

export interface SearchSuggestionHit {
  readonly id: string;
  readonly title: string;
  readonly categoryName: string;
  readonly city: string | null;
}

export interface SearchCategoryContextSuggestion {
  readonly text: string;
  readonly categoryName: string;
  readonly categoryId: string;
  readonly categorySlug: string;
}

export interface SearchSuggestionsResult {
  readonly searchSuggestions: string[];
  readonly categorySuggestions: SearchCategoryContextSuggestion[];
  readonly suggestions: SearchSuggestionHit[];
  readonly products: SearchSuggestionProduct[];
  readonly categories: SearchSuggestionCategory[];
  readonly sellers: SearchSuggestionSeller[];
  readonly popularSearches: string[];
}


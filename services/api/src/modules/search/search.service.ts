import { Injectable } from '@nestjs/common';
import { SEARCH_SUGGESTIONS_MAX_LIMIT } from '@marketplace/config';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import type { SearchListingsDto } from './dto/search-listings.dto';
import type { SearchSuggestionsDto } from './dto/search-listings.dto';
import { documentToSearchHit } from './mappers/listing-index.mapper';
import type { ListingSearchDocument } from './interfaces/listing-search-document.interface';
import type {
  SearchListingHit,
  SearchSuggestionHit,
} from './interfaces/search-result.interface';
import { MeilisearchService } from './meilisearch.service';
import {
  buildMeilisearchFilter,
  buildMeilisearchSort,
  sanitizeSearchQuery,
} from './utils/search-query.util';

@Injectable()
export class SearchService {
  constructor(private readonly meilisearch: MeilisearchService) {}

  async searchListings(dto: SearchListingsDto) {
    this.meilisearch.assertAvailable();

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const q = sanitizeSearchQuery(dto.q);
    const filter = buildMeilisearchFilter(dto);
    const sort = buildMeilisearchSort(dto.sortBy);

    const result = await this.meilisearch.searchDocuments<ListingSearchDocument>({
      q: q || '',
      filter,
      ...(sort ? { sort } : {}),
      page,
      limit,
    });

    const hits: SearchListingHit[] = result.hits.map(documentToSearchHit);

    return toPaginatedResponse({
      items: hits,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  async getSuggestions(dto: SearchSuggestionsDto & { limit?: number }) {
    this.meilisearch.assertAvailable();

    const q = sanitizeSearchQuery(dto.q);
    if (!q) {
      return { suggestions: [] as SearchSuggestionHit[] };
    }

    const limit = Math.min(
      dto.limit ?? 5,
      SEARCH_SUGGESTIONS_MAX_LIMIT,
    );

    const result = await this.meilisearch.searchDocuments<{
      id: string;
      title: string;
      categoryName: string;
      city: string | null;
    }>({
      q,
      filter: "status = 'active'",
      page: 1,
      limit,
      attributesToRetrieve: ['id', 'title', 'categoryName', 'city'],
    });

    const suggestions: SearchSuggestionHit[] = result.hits.map((hit) => ({
      id: hit.id,
      title: hit.title,
      categoryName: hit.categoryName,
      city: hit.city,
    }));

    return { suggestions };
  }
}

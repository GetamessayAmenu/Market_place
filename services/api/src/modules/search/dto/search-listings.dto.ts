import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SEARCH_MAX_QUERY_LENGTH } from '@marketplace/config';

import { SearchFilterDto } from './search-filter.dto';

export class SearchListingsDto extends SearchFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(SEARCH_MAX_QUERY_LENGTH)
  q?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'price_asc', 'price_desc', 'relevance'])
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'relevance' = 'relevance';
}

export class SearchSuggestionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(SEARCH_MAX_QUERY_LENGTH)
  q?: string;
}

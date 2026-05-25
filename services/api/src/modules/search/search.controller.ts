import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { SEARCH_SUGGESTIONS_MAX_LIMIT } from '@marketplace/config';

import { Public } from '../../common/decorators/public.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { SearchListingsDto, SearchSuggestionsDto } from './dto/search-listings.dto';
import { SearchService } from './search.service';
import { RATE_LIMIT_SEARCH_PREFIX } from './search.constants';

class SearchSuggestionsQueryDto extends SearchSuggestionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SEARCH_SUGGESTIONS_MAX_LIMIT)
  limit?: number;
}

@Controller('search')
@Public()
@UseGuards(RateLimitGuard)
@RateLimit({ limit: 120, windowMs: 60_000, keyPrefix: RATE_LIMIT_SEARCH_PREFIX })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query() dto: SearchListingsDto) {
    return this.searchService.searchListings(dto);
  }

  @Get('suggestions')
  @RateLimit({ limit: 180, windowMs: 60_000, keyPrefix: `${RATE_LIMIT_SEARCH_PREFIX}:suggest` })
  suggestions(@Query() dto: SearchSuggestionsQueryDto) {
    return this.searchService.getSuggestions(dto);
  }
}

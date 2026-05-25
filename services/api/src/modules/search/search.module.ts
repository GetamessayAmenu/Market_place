import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CategoriesModule } from '../categories/categories.module';
import { ListingsModule } from '../listings/listings.module';
import { ListingSearchIndexListener } from './listeners/listing-search-index.listener';
import { ListingSearchIndexerService } from './listing-search-indexer.service';
import { MeilisearchService } from './meilisearch.service';
import { ListingSearchIndexProcessor } from './processors/listing-search-index.processor';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    ListingsModule,
    CategoriesModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.SEARCH_INDEX }),
  ],
  controllers: [SearchController],
  providers: [
    MeilisearchService,
    SearchService,
    ListingSearchIndexerService,
    ListingSearchIndexListener,
    ListingSearchIndexProcessor,
    RateLimitGuard,
  ],
  exports: [MeilisearchService, SearchService, ListingSearchIndexerService],
})
export class SearchModule {}

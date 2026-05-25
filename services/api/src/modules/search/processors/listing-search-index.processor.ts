import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { QUEUE_NAMES } from '../../../infrastructure/queue/queue.constants';
import type { SearchIndexJobPayload } from '../interfaces/listing-search-document.interface';
import { ListingSearchIndexerService } from '../listing-search-indexer.service';
import { SEARCH_INDEX_JOB } from '../search.constants';

@Processor(QUEUE_NAMES.SEARCH_INDEX)
export class ListingSearchIndexProcessor extends WorkerHost {
  private readonly logger = new Logger(ListingSearchIndexProcessor.name);

  constructor(private readonly indexer: ListingSearchIndexerService) {
    super();
  }

  async process(job: Job<SearchIndexJobPayload>): Promise<void> {
    const { listingId, action } = job.data;

    if (action === SEARCH_INDEX_JOB.DELETE) {
      await this.indexer.deleteListing(listingId);
      return;
    }

    await this.indexer.upsertListing(listingId);
    this.logger.debug(`Processed search index job ${job.name} for ${listingId}`);
  }
}

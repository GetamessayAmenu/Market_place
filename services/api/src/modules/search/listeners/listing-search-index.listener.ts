import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Queue } from 'bullmq';

import { QUEUE_NAMES } from '../../../infrastructure/queue/queue.constants';
import { LISTING_EVENTS } from '../../listings/constants/listings.constants';
import type {
  ListingCreatedEvent,
  ListingDeletedEvent,
  ListingUpdatedEvent,
} from '../../listings/events/listing.events';
import { MeilisearchService } from '../meilisearch.service';
import { SEARCH_INDEX_JOB } from '../search.constants';
import type { SearchIndexJobPayload } from '../interfaces/listing-search-document.interface';

@Injectable()
export class ListingSearchIndexListener {
  private readonly logger = new Logger(ListingSearchIndexListener.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SEARCH_INDEX)
    private readonly searchIndexQueue: Queue<SearchIndexJobPayload>,
    private readonly meilisearch: MeilisearchService,
  ) {}

  @OnEvent(LISTING_EVENTS.CREATED)
  onCreated(event: ListingCreatedEvent): void {
    void this.enqueue(event.listingId, SEARCH_INDEX_JOB.UPSERT);
  }

  @OnEvent(LISTING_EVENTS.UPDATED)
  onUpdated(event: ListingUpdatedEvent): void {
    void this.enqueue(event.listingId, SEARCH_INDEX_JOB.UPSERT);
  }

  @OnEvent(LISTING_EVENTS.DELETED)
  onDeleted(event: ListingDeletedEvent): void {
    void this.enqueue(event.listingId, SEARCH_INDEX_JOB.DELETE);
  }

  @OnEvent(LISTING_EVENTS.SOLD)
  onSold(event: { readonly listingId: string }): void {
    void this.enqueue(event.listingId, SEARCH_INDEX_JOB.UPSERT);
  }

  @OnEvent(LISTING_EVENTS.RENEWED)
  onRenewed(event: { readonly listingId: string }): void {
    void this.enqueue(event.listingId, SEARCH_INDEX_JOB.UPSERT);
  }

  private async enqueue(
    listingId: string,
    action: SearchIndexJobPayload['action'],
  ): Promise<void> {
    if (!this.meilisearch.isConfigured) {
      return;
    }

    try {
      await this.searchIndexQueue.add(action, { listingId, action }, {
        jobId: `${action}:${listingId}:${Date.now()}`,
        removeOnComplete: true,
      });
    } catch (error) {
      this.logger.error(`Failed to enqueue search index job for ${listingId}`, error);
    }
  }
}

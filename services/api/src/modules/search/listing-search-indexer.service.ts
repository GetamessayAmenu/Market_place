import { Injectable, Logger } from '@nestjs/common';

import { CategoriesRepository } from '../categories/categories.repository';
import { ListingsRepository } from '../listings/listings.repository';
import {
  isListingSearchable,
  toListingSearchDocument,
} from './mappers/listing-index.mapper';
import { MeilisearchService } from './meilisearch.service';

@Injectable()
export class ListingSearchIndexerService {
  private readonly logger = new Logger(ListingSearchIndexerService.name);

  constructor(
    private readonly meilisearch: MeilisearchService,
    private readonly listingsRepository: ListingsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async upsertListing(listingId: string): Promise<void> {
    if (!this.meilisearch.isConfigured) {
      return;
    }

    const listing = await this.listingsRepository.findByIdWithRelations(listingId);
    if (!listing) {
      await this.deleteListing(listingId);
      return;
    }

    if (!isListingSearchable(listing)) {
      await this.deleteListing(listingId);
      return;
    }

    const parentCategory =
      listing.category.parentId !== null
        ? await this.categoriesRepository.findById(listing.category.parentId)
        : null;

    const document = toListingSearchDocument(listing, parentCategory);
    await this.meilisearch.indexDocuments([document]);
    this.logger.debug(`Indexed listing ${listingId}`);
  }

  async deleteListing(listingId: string): Promise<void> {
    if (!this.meilisearch.isConfigured) {
      return;
    }

    try {
      await this.meilisearch.deleteDocument(listingId);
      this.logger.debug(`Removed listing ${listingId} from search index`);
    } catch (error) {
      this.logger.warn(`Failed to delete listing ${listingId} from index`, error);
    }
  }
}

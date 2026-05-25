import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { LISTING_EVENTS } from '../listings/constants/listings.constants';
import { ListingFavoritedEvent } from '../listings/events/listing.events';
import { ListingNotFoundException } from '../listings/exceptions/listing.exceptions';
import { ListingsRepository } from '../listings/listings.repository';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly favoritesRepository: FavoritesRepository,
    private readonly listingsRepository: ListingsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async addFavorite(userId: string, listingId: string): Promise<{ readonly favorited: true }> {
    await this.assertActiveListing(listingId);
    const existing = await this.favoritesRepository.findByUserAndListing(userId, listingId);
    if (!existing) {
      await this.favoritesRepository.create(userId, listingId);
      this.eventEmitter.emit(
        LISTING_EVENTS.FAVORITED,
        new ListingFavoritedEvent(listingId, userId),
      );
    }
    return { favorited: true };
  }

  async removeFavorite(userId: string, listingId: string): Promise<{ readonly removed: true }> {
    const existing = await this.favoritesRepository.findByUserAndListing(userId, listingId);
    if (existing) {
      await this.favoritesRepository.remove(userId, listingId);
      this.eventEmitter.emit(LISTING_EVENTS.UNFAVORITED, { listingId, userId });
    }
    return { removed: true };
  }

  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    const row = await this.favoritesRepository.findByUserAndListing(userId, listingId);
    return row !== null;
  }

  async getFavoritedIds(userId: string, listingIds: readonly string[]): Promise<string[]> {
    return this.favoritesRepository.findListingIdsForUser(userId, listingIds);
  }

  private async assertActiveListing(listingId: string): Promise<void> {
    const listing = await this.listingsRepository.findByIdRaw(listingId);
    if (!listing || listing.deletedAt || listing.status !== 'active') {
      throw new ListingNotFoundException();
    }
  }
}

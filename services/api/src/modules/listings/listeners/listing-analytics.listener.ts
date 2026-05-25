import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { LISTING_EVENTS } from '../constants/listings.constants';
import type {
  ListingContactClickedEvent,
  ListingCreatedEvent,
  ListingFavoritedEvent,
  ListingViewedEvent,
} from '../events/listing.events';

/**
 * Analytics hook layer — logs events today; wire to warehouse/queues in later phases.
 */
@Injectable()
export class ListingAnalyticsListener {
  private readonly logger = new Logger(ListingAnalyticsListener.name);

  @OnEvent(LISTING_EVENTS.CREATED)
  onCreated(event: ListingCreatedEvent): void {
    this.logger.debug(`analytics:created listing=${event.listingId}`);
  }

  @OnEvent(LISTING_EVENTS.VIEWED)
  onViewed(event: ListingViewedEvent): void {
    this.logger.debug(`analytics:view listing=${event.listingId}`);
  }

  @OnEvent(LISTING_EVENTS.FAVORITED)
  onFavorited(event: ListingFavoritedEvent): void {
    this.logger.debug(`analytics:favorite listing=${event.listingId}`);
  }

  @OnEvent(LISTING_EVENTS.CONTACT_CLICKED)
  onContactClicked(event: ListingContactClickedEvent): void {
    this.logger.debug(
      `analytics:contact listing=${event.listingId} channel=${event.channel}`,
    );
  }
}

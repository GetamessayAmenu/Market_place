import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyticsRepository } from '../analytics.repository';

@Injectable()
export class AnalyticsEventListener {
  private readonly logger = new Logger(AnalyticsEventListener.name);

  constructor(private readonly repository: AnalyticsRepository) {}

  @OnEvent('listing.created', { async: true })
  async onListingCreated(event: { listingId: string; sellerId: string; categoryId?: string }) {
    try {
      await this.repository.recordEvent({
        eventType: 'listing_created',
        listingId: event.listingId,
        sellerId: event.sellerId,
        categoryId: event.categoryId || undefined,
      });
    } catch (err) {
      this.logger.error('Failed to log listing_created event', err);
    }
  }

  @OnEvent('listing.viewed', { async: true })
  async onListingViewed(event: { listingId: string; userId?: string; sellerId?: string; categoryId?: string }) {
    try {
      await this.repository.recordEvent({
        eventType: 'listing_viewed',
        listingId: event.listingId,
        userId: event.userId || undefined,
        sellerId: event.sellerId || undefined,
        categoryId: event.categoryId || undefined,
      });
    } catch (err) {
      this.logger.error('Failed to log listing_viewed event', err);
    }
  }

  @OnEvent('listing.favorited', { async: true })
  async onListingFavorited(event: { listingId: string; userId?: string }) {
    try {
      await this.repository.recordEvent({
        eventType: 'listing_favorited',
        listingId: event.listingId,
        userId: event.userId || undefined,
      });
    } catch (err) {
      this.logger.error('Failed to log listing_favorited event', err);
    }
  }

  @OnEvent('listing.contact_clicked', { async: true })
  async onListingContactClicked(event: { listingId: string; userId?: string; channel?: string }) {
    try {
      const channel = event.channel || 'seller_contacted';
      const eventType = channel.includes('whatsapp')
        ? 'whatsapp_clicked'
        : channel.includes('phone')
        ? 'phone_clicked'
        : 'seller_contacted';

      await this.repository.recordEvent({
        eventType,
        listingId: event.listingId,
        userId: event.userId || undefined,
        metadata: { channel },
      });
    } catch (err) {
      this.logger.error('Failed to log listing.contact_clicked event', err);
    }
  }

  @OnEvent('search.performed', { async: true })
  async onSearchPerformed(event: { query?: string; totalResults?: number; userId?: string }) {
    try {
      await this.repository.recordEvent({
        eventType: 'search_performed',
        userId: event.userId || undefined,
        metadata: { query: event.query, resultCount: event.totalResults ?? 0 },
      });
    } catch (err) {
      this.logger.error('Failed to log search_performed event', err);
    }
  }

  @OnEvent('order.created', { async: true })
  async onOrderCreated(event: { orderId: string; buyerId?: string; sellerId?: string; productId?: string }) {
    try {
      await this.repository.recordEvent({
        eventType: 'order_created',
        userId: event.buyerId || undefined,
        sellerId: event.sellerId || undefined,
        listingId: event.productId || undefined,
      });
    } catch (err) {
      this.logger.error('Failed to log order_created event', err);
    }
  }
}

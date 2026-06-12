import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { LISTING_EVENTS } from '../../listings/constants/listings.constants';
import { ListingsRepository } from '../../listings/listings.repository';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class NotificationEventListener implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly listingsRepository: ListingsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.setupChatEventListeners();
  }

  private setupChatEventListeners(): void {
    // Listen for chat.message_sent event from realtime service
    // This event is emitted via Redis pub/sub or direct emission if realtime is in same process
    this.eventEmitter.on(
      'chat.message_sent',
      async (event: { recipientId: string; senderId: string; conversationId: string; messagePreview: string }) => {
        try {
          await this.notificationsService.createMessageNotification(
            event.recipientId,
            event.senderId,
            event.conversationId,
            event.messagePreview,
          );
        } catch (error) {
          this.logger.error(`Failed to create message notification: ${(error as Error).message}`);
        }
      },
    );
  }

  @OnEvent(LISTING_EVENTS.CREATED)
  async handleListingCreated(_payload: { listingId: string; sellerId: string }): Promise<void> {
    // Listing created notifications are triggered when status changes to active
    // This is currently a placeholder as we notify on approval, not creation
  }

  @OnEvent(LISTING_EVENTS.UPDATED)
  async handleListingUpdated(payload: { listingId: string; sellerId: string }): Promise<void> {
    try {
      // Fetch the listing to check if status changed to active (approved) or rejected
      const listing = await this.listingsRepository.findByIdRaw(payload.listingId);
      if (!listing) {
        return;
      }

      if (listing.status === 'active') {
        // Listing was approved
        await this.notificationsService.createListingApprovedNotification(
          payload.sellerId,
          payload.listingId,
          listing.title,
        );
      } else if (listing.status === 'rejected') {
        // Listing was rejected
        const reason = listing.rejectedReason ?? undefined;
        await this.notificationsService.createListingRejectedNotification(
          payload.sellerId,
          payload.listingId,
          listing.title,
          reason,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle listing update: ${(error as Error).message}`);
    }
  }

  @OnEvent(LISTING_EVENTS.FAVORITED)
  async handleListingFavorited(payload: { listingId: string; userId: string }): Promise<void> {
    try {
      // Fetch listing details to get seller info and title
      const listing = await this.listingsRepository.findByIdRaw(payload.listingId);
      if (!listing || listing.deletedAt) {
        return;
      }

      // Only notify seller if listing is active
      if (listing.status === 'active') {
        await this.notificationsService.createListingFavoritedNotification(
          listing.sellerId,
          payload.listingId,
          listing.title,
          payload.userId,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle listing favorited: ${(error as Error).message}`);
    }
  }

  @OnEvent('user.verified')
  async handleUserVerified(payload: { userId: string; verificationType: 'email' | 'phone' | 'identity' | 'business' }): Promise<void> {
    try {
      await this.notificationsService.createSellerVerifiedNotification(
        payload.userId,
        payload.verificationType,
      );
    } catch (error) {
      this.logger.error(`Failed to handle user verified: ${(error as Error).message}`);
    }
  }
}

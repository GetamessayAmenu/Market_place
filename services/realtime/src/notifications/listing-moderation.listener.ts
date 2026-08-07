import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NotificationsGateway } from './notifications.gateway';

/**
 * Listener for listing moderation events from the API service.
 * Emits Socket.IO events to sellers when their listings are moderated.
 */
@Injectable()
export class ListingModerationListener implements OnModuleInit {
  private readonly logger = new Logger(ListingModerationListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  onModuleInit(): void {
    this.setupModerationEventListener();
  }

  private setupModerationEventListener(): void {
    // Listen for listing.moderated event from API service
    this.eventEmitter.on(
      'listing.moderated',
      (event: { sellerId: string; listingId: string; status: string; reason?: string; title?: string }) => {
        try {
          const eventData: { listingId: string; status: string; reason?: string } = {
            listingId: event.listingId,
            status: event.status,
          };
          if (event.reason) {
            eventData.reason = event.reason;
          }
          this.notificationsGateway.sendListingModeratedEvent(event.sellerId, eventData);
          this.logger.log(
            `Processed listing moderation event for seller ${event.sellerId}, listing ${event.listingId}, status ${event.status}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process listing moderation event: ${(error as Error).message}`,
          );
        }
      },
    );
  }
}

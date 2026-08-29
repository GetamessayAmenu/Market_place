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
  async handleListingCreated(payload: { listingId: string; sellerId: string }): Promise<void> {
    try {
      const listing = await this.listingsRepository.findByIdRaw(payload.listingId);
      if (listing) {
        await this.notificationsService.createListingSubmittedNotification(
          payload.sellerId,
          payload.listingId,
          listing.title,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle listing created: ${(error as Error).message}`);
    }
  }

  @OnEvent(LISTING_EVENTS.UPDATED)
  async handleListingUpdated(payload: { listingId: string; sellerId: string }): Promise<void> {
    try {
      const listing = await this.listingsRepository.findByIdRaw(payload.listingId);
      if (!listing) {
        return;
      }

      if (listing.status === 'active') {
        await this.notificationsService.createListingApprovedNotification(
          payload.sellerId,
          payload.listingId,
          listing.title,
        );
        this.eventEmitter.emit('listing.moderated', {
          sellerId: payload.sellerId,
          listingId: payload.listingId,
          status: 'active',
          title: listing.title,
        });
      } else if (listing.status === 'rejected') {
        const reason = listing.rejectedReason ?? undefined;
        await this.notificationsService.createListingRejectedNotification(
          payload.sellerId,
          payload.listingId,
          listing.title,
          reason,
        );
        this.eventEmitter.emit('listing.moderated', {
          sellerId: payload.sellerId,
          listingId: payload.listingId,
          status: 'rejected',
          reason,
          title: listing.title,
        });
      } else if (listing.status === 'pending_review') {
        const reason = listing.rejectedReason ?? undefined;
        this.eventEmitter.emit('listing.moderated', {
          sellerId: payload.sellerId,
          listingId: payload.listingId,
          status: 'pending_review',
          reason,
          title: listing.title,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to handle listing update: ${(error as Error).message}`);
    }
  }

  @OnEvent(LISTING_EVENTS.FAVORITED)
  async handleListingFavorited(payload: { listingId: string; userId: string }): Promise<void> {
    try {
      const listing = await this.listingsRepository.findByIdRaw(payload.listingId);
      if (!listing || listing.deletedAt) {
        return;
      }

      if (listing.status === 'active') {
        await this.notificationsService.createFavoriteListingEventNotification(
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

  @OnEvent('order.created')
  async handleOrderCreated(payload: {
    sellerId: string;
    orderId: string;
    orderNumber: string;
    listingTitle: string;
    buyerName: string;
    totalAmount: number;
    currency: string;
  }): Promise<void> {
    try {
      await this.notificationsService.createOrderCreatedNotification(
        payload.sellerId,
        payload.orderId,
        payload.orderNumber,
        payload.listingTitle,
        payload.buyerName,
        payload.totalAmount,
        payload.currency,
      );
    } catch (error) {
      this.logger.error(`Failed to handle order created: ${(error as Error).message}`);
    }
  }

  @OnEvent('order.status_updated')
  async handleOrderStatusUpdated(payload: {
    userId: string;
    orderId: string;
    orderNumber: string;
    status: string;
    listingTitle: string;
  }): Promise<void> {
    try {
      await this.notificationsService.createOrderStatusChangedNotification(
        payload.userId,
        payload.orderId,
        payload.orderNumber,
        payload.status,
        payload.listingTitle,
      );
    } catch (error) {
      this.logger.error(`Failed to handle order status updated: ${(error as Error).message}`);
    }
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(payload: {
    userId: string;
    orderId: string;
    orderNumber: string;
    listingTitle: string;
    reason?: string;
  }): Promise<void> {
    try {
      await this.notificationsService.createOrderCancelledNotification(
        payload.userId,
        payload.orderId,
        payload.orderNumber,
        payload.listingTitle,
        payload.reason,
      );
    } catch (error) {
      this.logger.error(`Failed to handle order cancelled: ${(error as Error).message}`);
    }
  }

  @OnEvent('rental.request_received')
  async handleRentalRequestReceived(payload: {
    sellerId: string;
    rentalOrderId: string;
    orderNumber: string;
    listingTitle: string;
    renterName: string;
  }): Promise<void> {
    try {
      await this.notificationsService.createRentalRequestReceivedNotification(
        payload.sellerId,
        payload.rentalOrderId,
        payload.orderNumber,
        payload.listingTitle,
        payload.renterName,
      );
    } catch (error) {
      this.logger.error(`Failed to handle rental request received: ${(error as Error).message}`);
    }
  }

  @OnEvent('rental.status_changed')
  async handleRentalStatusChanged(payload: {
    userId: string;
    rentalOrderId: string;
    orderNumber: string;
    status: string;
    listingTitle: string;
  }): Promise<void> {
    try {
      await this.notificationsService.createRentalStatusChangedNotification(
        payload.userId,
        payload.rentalOrderId,
        payload.orderNumber,
        payload.status,
        payload.listingTitle,
      );
    } catch (error) {
      this.logger.error(`Failed to handle rental status changed: ${(error as Error).message}`);
    }
  }

  @OnEvent('custom_order.created')
  async handleCustomOrderCreated(payload: {
    sellerId: string;
    customOrderId: string;
    listingTitle: string;
    buyerName: string;
  }): Promise<void> {
    try {
      await this.notificationsService.createCustomOrderReceivedNotification(
        payload.sellerId,
        payload.customOrderId,
        payload.listingTitle,
        payload.buyerName,
      );
    } catch (error) {
      this.logger.error(`Failed to handle custom order created: ${(error as Error).message}`);
    }
  }

  @OnEvent('custom_order.status_updated')
  async handleCustomOrderStatusUpdated(payload: {
    userId: string;
    customOrderId: string;
    status: string;
    listingTitle: string;
  }): Promise<void> {
    try {
      await this.notificationsService.createCustomOrderStatusChangedNotification(
        payload.userId,
        payload.customOrderId,
        payload.status,
        payload.listingTitle,
      );
    } catch (error) {
      this.logger.error(`Failed to handle custom order status updated: ${(error as Error).message}`);
    }
  }

  @OnEvent('moderation.action')
  async handleModerationAction(payload: {
    userId: string;
    action: string;
    reason: string;
  }): Promise<void> {
    try {
      await this.notificationsService.createModerationActionNotification(
        payload.userId,
        payload.action,
        payload.reason,
      );
    } catch (error) {
      this.logger.error(`Failed to handle moderation action: ${(error as Error).message}`);
    }
  }
}

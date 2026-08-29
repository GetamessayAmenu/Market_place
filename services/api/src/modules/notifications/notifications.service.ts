import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType, type Notification } from '@prisma/client';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';

import { NOTIFICATION_DOMAIN_EVENTS } from '../events/events.constants';
import {
  ListingApprovedEvent,
  ListingFavoritedEvent,
  ListingRejectedEvent,
  MessageReceivedEvent,
  ReportStatusUpdatedEvent,
  SellerVerifiedEvent,
  SystemAnnouncementEvent,
} from '../events/notification.domain-events';
import { InAppChannel } from './channels/in-app.channel';
import type { NotificationPayload } from './channels/channel.interface';
import type { NotificationQueryDto } from './dto/notification-query.dto';
import type { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly inAppChannel: InAppChannel,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    user: AuthenticatedUser,
    query: NotificationQueryDto,
  ): Promise<ReturnType<typeof toPaginatedResponse<NotificationResponseDto>>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.notificationsRepository.findByUserId(user.id, {
      page,
      limit,
      ...(query.type !== undefined ? { type: query.type } : {}),
      ...(query.unreadOnly !== undefined ? { unreadOnly: query.unreadOnly } : {}),
    });

    const items = result.items.map((n) => this.serializeNotification(n));

    return toPaginatedResponse({
      ...result,
      items,
      page,
      limit,
    });
  }

  async markAsRead(
    user: AuthenticatedUser,
    id: string,
  ): Promise<NotificationResponseDto | null> {
    const notification = await this.notificationsRepository.markAsRead(
      id,
      user.id,
    );
    if (!notification) {
      return null;
    }
    return this.serializeNotification(notification);
  }

  async markAllAsRead(user: AuthenticatedUser): Promise<{ markedCount: number }> {
    const count = await this.notificationsRepository.markAllAsRead(user.id);
    return { markedCount: count };
  }

  async deleteNotification(
    user: AuthenticatedUser,
    id: string,
  ): Promise<{ success: boolean }> {
    const deleted = await this.notificationsRepository.deleteNotification(
      id,
      user.id,
    );
    return { success: deleted };
  }

  async getUnreadCount(user: AuthenticatedUser): Promise<number> {
    return this.notificationsRepository.countUnread(user.id);
  }

  async dispatchNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string | null,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const allowed = await this.preferencesService.shouldDeliver(userId, type);
    if (!allowed) {
      this.logger.log(`Notification of type ${type} suppressed by user preferences for user ${userId}`);
      return;
    }

    const payload: NotificationPayload = {
      userId,
      type,
      title,
      body: body ?? null,
    };
    if (data) {
      payload.data = data;
    }

    await this.inAppChannel.send(payload);
  }

  async createCustomNotification(
    userId: string,
    type: string,
    title: string,
    body?: string | null,
    data?: Record<string, any>,
  ): Promise<void> {
    const validTypes = Object.values(NotificationType) as string[];
    const notifType = (validTypes.includes(type) ? type : 'system') as NotificationType;
    await this.dispatchNotification(
      userId,
      notifType,
      title,
      body,
      data,
    );
  }

  async createMessageNotification(
    recipientId: string,
    senderId: string,
    conversationId: string,
    messagePreview: string,
  ): Promise<void> {
    await this.dispatchNotification(
      recipientId,
      'new_message',
      'New message',
      messagePreview.slice(0, 100),
      { senderId, conversationId },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.MESSAGE_RECEIVED,
      new MessageReceivedEvent(
        recipientId,
        senderId,
        conversationId,
        messagePreview,
      ),
    );
  }

  async createListingSubmittedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'listing_submitted',
      'Listing submitted for review',
      `Your listing "${listingTitle}" has been submitted for admin review.`,
      { listingId, listingTitle },
    );
  }

  async createListingApprovedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'listing_approved',
      'Listing approved',
      `Your listing "${listingTitle}" has been approved and is now active.`,
      { listingId, listingTitle },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.LISTING_APPROVED,
      new ListingApprovedEvent(sellerId, listingId, listingTitle),
    );
  }

  async createListingRejectedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
    reason?: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'listing_rejected',
      'Listing rejected',
      reason
        ? `Your listing "${listingTitle}" was rejected: ${reason}`
        : `Your listing "${listingTitle}" was rejected`,
      { listingId, listingTitle, reason },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.LISTING_REJECTED,
      new ListingRejectedEvent(sellerId, listingId, listingTitle, reason),
    );
  }

  async createListingChangesRequestedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
    reason?: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'listing_rejected',
      'Changes requested',
      reason
        ? `Your listing "${listingTitle}" requires changes: ${reason}`
        : `Your listing "${listingTitle}" requires changes before approval`,
      { listingId, listingTitle, reason },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.LISTING_REJECTED,
      new ListingRejectedEvent(sellerId, listingId, listingTitle, reason),
    );
  }

  async createSignificantChangesSubmittedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'system',
      'Changes submitted for review',
      `Your updates to "${listingTitle}" have been submitted for admin review.`,
      { listingId, listingTitle },
    );
  }

  async createRejectedListingResubmittedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'system',
      'Listing resubmitted',
      `Your rejected listing "${listingTitle}" has been resubmitted for admin review.`,
      { listingId, listingTitle },
    );
  }

  async createRevisionApprovedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'listing_approved',
      'Listing update approved',
      `Your changes to listing "${listingTitle}" have been approved and are now public.`,
      { listingId, listingTitle },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.LISTING_APPROVED,
      new ListingApprovedEvent(sellerId, listingId, listingTitle),
    );
  }

  async createRevisionRejectedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
    reason?: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'listing_rejected',
      'Listing update rejected',
      reason
        ? `Your changes to listing "${listingTitle}" were rejected: ${reason}.`
        : `Your changes to listing "${listingTitle}" were rejected.`,
      { listingId, listingTitle, reason },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.LISTING_REJECTED,
      new ListingRejectedEvent(sellerId, listingId, listingTitle, reason),
    );
  }

  async createListingStatusChangedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
    status: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'listing_status_changed',
      'Listing status changed',
      `Status for listing "${listingTitle}" changed to ${status}`,
      { listingId, listingTitle, status },
    );
  }

  async createListingFavoritedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
    userId: string,
  ): Promise<void> {
    await this.createFavoriteListingEventNotification(sellerId, listingId, listingTitle, userId);
  }

  async createFavoriteListingEventNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
    favoritedByUserId: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'favorite_listing_event',
      'Listing favorited',
      `Someone favorited your listing "${listingTitle}"`,
      { listingId, listingTitle, favoritedByUserId },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.LISTING_FAVORITED,
      new ListingFavoritedEvent(sellerId, listingId, listingTitle, favoritedByUserId),
    );
  }

  async createNewOrderNotification(
    sellerId: string,
    orderId: string,
    orderNumber: string,
    listingTitle: string,
    buyerName: string,
    totalAmount: number,
    currency: string,
  ): Promise<void> {
    await this.createOrderCreatedNotification(
      sellerId,
      orderId,
      orderNumber,
      listingTitle,
      buyerName,
      totalAmount,
      currency,
    );
  }

  async createOrderCreatedNotification(
    sellerId: string,
    orderId: string,
    orderNumber: string,
    listingTitle: string,
    buyerName: string,
    totalAmount: number,
    currency: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'order_created',
      'New order received',
      `You received a new order for "${listingTitle}" (${currency} ${totalAmount}) from ${buyerName}`,
      { orderId, orderNumber, listingTitle, buyerName, totalAmount, currency },
    );
  }

  async createOrderStatusUpdatedNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    await this.createOrderStatusChangedNotification(userId, orderId, orderNumber, status, listingTitle);
  }

  async createOrderStatusChangedNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      userId,
      'order_status_changed',
      'Order status updated',
      `Order ${orderNumber} for "${listingTitle}": ${status}`,
      { orderId, orderNumber, status, listingTitle },
    );
  }

  async createOrderCancelledNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    listingTitle: string,
    reason?: string,
  ): Promise<void> {
    await this.dispatchNotification(
      userId,
      'order_cancelled',
      'Order cancelled',
      reason
        ? `Order ${orderNumber} for "${listingTitle}" was cancelled: ${reason}`
        : `Order ${orderNumber} for "${listingTitle}" was cancelled`,
      { orderId, orderNumber, listingTitle, reason },
    );
  }

  async createRentalRequestReceivedNotification(
    sellerId: string,
    rentalOrderId: string,
    orderNumber: string,
    listingTitle: string,
    renterName: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'rental_request_received',
      'New rental request',
      `${renterName} requested to rent "${listingTitle}" (Order ${orderNumber})`,
      { rentalOrderId, orderNumber, listingTitle, renterName },
    );
  }

  async createRentalRequestAcceptedNotification(
    renterId: string,
    rentalOrderId: string,
    orderNumber: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      renterId,
      'rental_request_accepted',
      'Rental request accepted',
      `Your rental request for "${listingTitle}" (Order ${orderNumber}) has been accepted!`,
      { rentalOrderId, orderNumber, listingTitle },
    );
  }

  async createRentalRequestRejectedNotification(
    renterId: string,
    rentalOrderId: string,
    orderNumber: string,
    listingTitle: string,
    reason?: string,
  ): Promise<void> {
    await this.dispatchNotification(
      renterId,
      'rental_request_rejected',
      'Rental request rejected',
      reason
        ? `Your rental request for "${listingTitle}" was rejected: ${reason}`
        : `Your rental request for "${listingTitle}" was rejected`,
      { rentalOrderId, orderNumber, listingTitle, reason },
    );
  }

  async createRentalStatusUpdatedNotification(
    userId: string,
    rentalOrderId: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    await this.createRentalStatusChangedNotification(userId, rentalOrderId, '', status, listingTitle);
  }

  async createRentalStatusChangedNotification(
    userId: string,
    rentalOrderId: string,
    orderNumber: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      userId,
      'rental_status_changed',
      'Rental status updated',
      `Rental order ${orderNumber || rentalOrderId} for "${listingTitle}": ${status}`,
      { rentalOrderId, orderNumber, status, listingTitle },
    );
  }

  async createCustomOrderReceivedNotification(
    sellerId: string,
    customOrderId: string,
    listingTitle: string,
    buyerName: string,
  ): Promise<void> {
    await this.dispatchNotification(
      sellerId,
      'custom_order_received',
      'New custom order request',
      `${buyerName} requested a custom order for "${listingTitle}"`,
      { customOrderId, listingTitle, buyerName },
    );
  }

  async createCustomOrderStatusUpdatedNotification(
    userId: string,
    customOrderId: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    await this.createCustomOrderStatusChangedNotification(userId, customOrderId, status, listingTitle);
  }

  async createCustomOrderStatusChangedNotification(
    userId: string,
    customOrderId: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    await this.dispatchNotification(
      userId,
      'custom_order_status_changed',
      'Custom order status updated',
      `Custom order for "${listingTitle}": ${status}`,
      { customOrderId, status, listingTitle },
    );
  }

  async createSellerStatusChangedNotification(
    userId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    await this.dispatchNotification(
      userId,
      'verification_update',
      'Account status changed',
      `Your account status has been changed from ${oldStatus} to ${newStatus}`,
      { oldStatus, newStatus },
    );
  }

  async createModerationActionNotification(
    userId: string,
    action: string,
    reason: string,
  ): Promise<void> {
    await this.dispatchNotification(
      userId,
      'moderation_action',
      'Account moderation action',
      `Moderation notice: ${action}. Reason: ${reason}`,
      { action, reason },
    );
  }

  async createSecurityEventNotification(
    userId: string,
    title: string,
    message: string,
  ): Promise<void> {
    await this.dispatchNotification(
      userId,
      'security_event',
      title,
      message,
      { securityEvent: true },
    );
  }

  async createSellerVerifiedNotification(
    userId: string,
    verificationType: 'email' | 'phone' | 'identity' | 'business',
  ): Promise<void> {
    await this.dispatchNotification(
      userId,
      'verification_update',
      'Verification successful',
      `Your ${verificationType} verification has been approved`,
      { verificationType },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.SELLER_VERIFIED,
      new SellerVerifiedEvent(userId, verificationType),
    );
  }

  createSystemAnnouncement(
    title: string,
    body: string,
    targetAudience?: 'all' | 'sellers' | 'buyers' | 'admins',
  ): void {
    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.SYSTEM_ANNOUNCEMENT,
      new SystemAnnouncementEvent(title, body, targetAudience),
    );
  }

  async createReportStatusUpdatedNotification(
    reporterId: string,
    reportId: string,
    status: string,
    targetType: string,
  ): Promise<void> {
    await this.dispatchNotification(
      reporterId,
      'report_update',
      'Report status updated',
      `Your report status has been updated to: ${status}`,
      { reportId, status, targetType },
    );

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.REPORT_STATUS_UPDATED,
      new ReportStatusUpdatedEvent(reporterId, reportId, status, targetType),
    );
  }

  private serializeNotification(
    notification: Notification,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown> | null,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      isRead: notification.readAt !== null,
    };
  }
}

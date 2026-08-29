import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Notification } from '@prisma/client';

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
import type { NotificationQueryDto } from './dto/notification-query.dto';
import type { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(user: AuthenticatedUser, query: NotificationQueryDto): Promise<ReturnType<typeof toPaginatedResponse<NotificationResponseDto>>> {
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

  async markAsRead(user: AuthenticatedUser, id: string): Promise<NotificationResponseDto | null> {
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

  async getUnreadCount(user: AuthenticatedUser): Promise<number> {
    return this.notificationsRepository.countUnread(user.id);
  }

  async createMessageNotification(
    recipientId: string,
    senderId: string,
    conversationId: string,
    messagePreview: string,
  ): Promise<void> {
    await this.notificationsRepository.create({
      user: { connect: { id: recipientId } },
      type: 'new_message',
      title: 'New message',
      body: messagePreview.slice(0, 100),
      data: {
        senderId,
        conversationId,
      },
    });

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

  async createListingApprovedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
  ): Promise<void> {
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'listing_approved',
      title: 'Listing approved',
      body: `Your listing "${listingTitle}" has been approved`,
      data: {
        listingId,
        listingTitle,
      },
    });

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
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'listing_rejected',
      title: 'Listing rejected',
      body: reason
        ? `Your listing "${listingTitle}" was rejected: ${reason}`
        : `Your listing "${listingTitle}" was rejected`,
      data: {
        listingId,
        listingTitle,
        reason,
      },
    });

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
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'listing_rejected',
      title: 'Changes requested',
      body: reason
        ? `Your listing "${listingTitle}" requires changes: ${reason}`
        : `Your listing "${listingTitle}" requires changes before approval`,
      data: {
        listingId,
        listingTitle,
        reason,
      },
    });

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
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'system',
      title: 'Changes submitted for review',
      body: `Your updates to "${listingTitle}" have been submitted for admin review. The current approved version remains public.`,
      data: { listingId, listingTitle },
    });
  }

  async createRejectedListingResubmittedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
  ): Promise<void> {
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'system',
      title: 'Listing resubmitted',
      body: `Your rejected listing "${listingTitle}" has been resubmitted for admin review.`,
      data: { listingId, listingTitle },
    });
  }

  async createRevisionApprovedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
  ): Promise<void> {
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'listing_approved',
      title: 'Listing update approved',
      body: `Your changes to listing "${listingTitle}" have been approved and are now public.`,
      data: { listingId, listingTitle },
    });

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
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'listing_rejected',
      title: 'Listing update rejected',
      body: reason
        ? `Your changes to listing "${listingTitle}" were rejected: ${reason}. The previous approved version remains public.`
        : `Your changes to listing "${listingTitle}" were rejected. The previous approved version remains public.`,
      data: { listingId, listingTitle, reason },
    });

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.LISTING_REJECTED,
      new ListingRejectedEvent(sellerId, listingId, listingTitle, reason),
    );
  }

  async createListingFavoritedNotification(
    sellerId: string,
    listingId: string,
    listingTitle: string,
    userId: string,
  ): Promise<void> {
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'new_offer',
      title: 'Listing favorited',
      body: `Someone favorited your listing "${listingTitle}"`,
      data: {
        listingId,
        listingTitle,
        userId,
      },
    });

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.LISTING_FAVORITED,
      new ListingFavoritedEvent(sellerId, listingId, listingTitle, userId),
    );
  }

  async createSellerVerifiedNotification(
    userId: string,
    verificationType: 'email' | 'phone' | 'identity' | 'business',
  ): Promise<void> {
    await this.notificationsRepository.create({
      user: { connect: { id: userId } },
      type: 'verification_update',
      title: 'Verification successful',
      body: `Your ${verificationType} verification has been approved`,
      data: {
        verificationType,
      },
    });

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.SELLER_VERIFIED,
      new SellerVerifiedEvent(userId, verificationType),
    );
  }

  async createCustomNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    await this.notificationsRepository.create({
      user: { connect: { id: userId } },
      type: type as any,
      title,
      body,
      ...(data !== undefined ? { data } : {}),
    });
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
    await this.notificationsRepository.create({
      user: { connect: { id: sellerId } },
      type: 'new_order' as any,
      title: 'New order received',
      body: `You have a new order for "${listingTitle}" - ${currency} ${totalAmount.toLocaleString()}`,
      data: {
        orderId,
        orderNumber,
        listingTitle,
        buyerName,
        totalAmount,
        currency,
      },
    });
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
    const statusMessages: Record<string, string> = {
      under_review: 'Your report is under review',
      investigating: 'Your report is being investigated',
      resolved: 'Your report has been resolved',
      dismissed: 'Your report has been dismissed',
      closed: 'Your report has been closed',
    };

    const title = 'Report status updated';
    const body = statusMessages[status] || `Your report status has been updated to: ${status}`;

    await this.notificationsRepository.create({
      user: { connect: { id: reporterId } },
      type: 'report_update',
      title,
      body,
      data: {
        reportId,
        status,
        targetType,
      },
    });

    this.eventEmitter.emit(
      NOTIFICATION_DOMAIN_EVENTS.REPORT_STATUS_UPDATED,
      new ReportStatusUpdatedEvent(reporterId, reportId, status, targetType),
    );
  }

  async createOrderStatusUpdatedNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      pending: 'Order placed successfully',
      confirmed: 'Order confirmed by seller',
      processing: 'Order is being processed',
      shipped: 'Order has been shipped',
      delivered: 'Order has been delivered',
      cancelled: 'Order has been cancelled',
      refunded: 'Order has been refunded',
    };

    const title = 'Order status updated';
    const body = `Order ${orderNumber} for "${listingTitle}": ${statusMessages[status] || status}`;

    await this.createCustomNotification(
      userId,
      'new_order',
      title,
      body,
      {
        orderId,
        orderNumber,
        status,
        listingTitle,
      },
    );
  }

  async createCustomOrderStatusUpdatedNotification(
    userId: string,
    customOrderId: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      submitted: 'Custom order request submitted',
      under_review: 'Custom order is under review',
      confirmed: 'Custom order confirmed',
      in_production: 'Custom order is in production',
      shipped: 'Custom order has been shipped',
      delivered: 'Custom order has been delivered',
      cancelled: 'Custom order has been cancelled',
    };

    const title = 'Custom order status updated';
    const body = `"${listingTitle}": ${statusMessages[status] || status}`;

    await this.createCustomNotification(
      userId,
      'new_offer',
      title,
      body,
      {
        customOrderId,
        status,
        listingTitle,
      },
    );
  }

  async createRentalStatusUpdatedNotification(
    userId: string,
    rentalOrderId: string,
    status: string,
    listingTitle: string,
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      requested: 'Rental request submitted',
      confirmed: 'Rental confirmed',
      active: 'Rental period started',
      returned: 'Item returned',
      completed: 'Rental completed',
      cancelled: 'Rental cancelled',
    };

    const title = 'Rental status updated';
    const body = `"${listingTitle}": ${statusMessages[status] || status}`;

    await this.createCustomNotification(
      userId,
      'new_message',
      title,
      body,
      {
        rentalOrderId,
        status,
        listingTitle,
      },
    );
  }

  async createSellerStatusChangedNotification(
    userId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    const title = 'Account status changed';
    const body = `Your account status has been changed from ${oldStatus} to ${newStatus}`;

    await this.createCustomNotification(
      userId,
      'verification_update',
      title,
      body,
      {
        oldStatus,
        newStatus,
      },
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

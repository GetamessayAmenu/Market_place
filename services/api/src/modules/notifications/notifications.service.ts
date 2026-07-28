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

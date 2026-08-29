import { Injectable } from '@nestjs/common';
import type { NotificationPreference, NotificationType } from '@prisma/client';
import { NotificationPreferencesRepository } from './notification-preferences.repository';

@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly preferencesRepository: NotificationPreferencesRepository,
  ) {}

  async getPreferences(userId: string): Promise<NotificationPreference> {
    return this.preferencesRepository.getOrCreateDefault(userId);
  }

  async updatePreferences(
    userId: string,
    data: Partial<Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<NotificationPreference> {
    return this.preferencesRepository.updatePreferences(userId, data);
  }

  async shouldDeliver(userId: string, type: NotificationType): Promise<boolean> {
    // Critical security and account events are never muted
    const criticalTypes: NotificationType[] = [
      'security_event',
      'moderation_action',
      'system',
      'report_update',
      'verification_update',
    ];

    if (criticalTypes.includes(type)) {
      return true;
    }

    const prefs = await this.getPreferences(userId);

    switch (type) {
      case 'new_message':
        return prefs.chat;

      case 'listing_submitted':
      case 'listing_approved':
      case 'listing_rejected':
      case 'listing_status_changed':
      case 'favorite_listing_event':
        return prefs.listing;

      case 'order_created':
      case 'order_status_changed':
      case 'order_cancelled':
      case 'new_order':
        return prefs.order;

      case 'rental_request_received':
      case 'rental_request_accepted':
      case 'rental_request_rejected':
      case 'rental_status_changed':
        return prefs.rental;

      case 'custom_order_received':
      case 'custom_order_status_changed':
        return prefs.customOrder;

      case 'system_announcement':
      case 'new_offer':
        return prefs.promotional;

      default:
        return true;
    }
  }
}

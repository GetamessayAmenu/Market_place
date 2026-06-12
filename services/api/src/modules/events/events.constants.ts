/** Domain event names for notifications system. */
export const NOTIFICATION_DOMAIN_EVENTS = {
  MESSAGE_RECEIVED: 'notification.message_received',
  LISTING_APPROVED: 'notification.listing_approved',
  LISTING_REJECTED: 'notification.listing_rejected',
  LISTING_FAVORITED: 'notification.listing_favorited',
  SELLER_VERIFIED: 'notification.seller_verified',
  SYSTEM_ANNOUNCEMENT: 'notification.system_announcement',
} as const;

/** Source events that trigger notifications. */
export const SOURCE_EVENTS = {
  LISTING_CREATED: 'listing.created',
  LISTING_UPDATED: 'listing.updated',
  LISTING_STATUS_CHANGED: 'listing.status_changed',
  MESSAGE_SENT: 'chat.message_sent',
  LISTING_FAVORITED: 'listing.favorited',
  USER_VERIFIED: 'user.verified',
} as const;

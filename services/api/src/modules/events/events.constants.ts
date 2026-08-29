/** Domain event names for notifications system. */
export const NOTIFICATION_DOMAIN_EVENTS = {
  MESSAGE_RECEIVED: 'notification.message_received',
  LISTING_APPROVED: 'notification.listing_approved',
  LISTING_REJECTED: 'notification.listing_rejected',
  LISTING_FAVORITED: 'notification.listing_favorited',
  SELLER_VERIFIED: 'notification.seller_verified',
  SYSTEM_ANNOUNCEMENT: 'notification.system_announcement',
  REPORT_STATUS_UPDATED: 'notification.report_status_updated',
  CUSTOM_ORDER_CREATED: 'notification.custom_order_created',
  CUSTOM_ORDER_STATUS_UPDATED: 'notification.custom_order_status_updated',
  DISPUTE_CREATED: 'notification.dispute_created',
  DISPUTE_STATUS_CHANGED: 'notification.dispute_status_changed',
  DISPUTE_RESOLVED: 'notification.dispute_resolved',
} as const;

/** Source events that trigger notifications. */
export const SOURCE_EVENTS = {
  LISTING_CREATED: 'listing.created',
  LISTING_UPDATED: 'listing.updated',
  LISTING_STATUS_CHANGED: 'listing.status_changed',
  MESSAGE_SENT: 'chat.message_sent',
  LISTING_FAVORITED: 'listing.favorited',
  USER_VERIFIED: 'user.verified',
  CUSTOM_ORDER_CREATED: 'custom_order.created',
  CUSTOM_ORDER_STATUS_UPDATED: 'custom_order.status_updated',
  DISPUTE_CREATED: 'dispute.created',
  DISPUTE_STATUS_CHANGED: 'dispute.status_changed',
  DISPUTE_EVIDENCE_ADDED: 'dispute.evidence_added',
  DISPUTE_INFO_REQUESTED: 'dispute.information_requested',
  DISPUTE_ESCALATED: 'dispute.escalated',
  DISPUTE_RESOLVED: 'dispute.resolved',
  DISPUTE_REOPENED: 'dispute.reopened',
  DISPUTE_CLOSED: 'dispute.closed',
} as const;

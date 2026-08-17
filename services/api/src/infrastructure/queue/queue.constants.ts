/** BullMQ queue names — domain workers register in later phases. */
export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  SEARCH_INDEX: 'search-index',
  EMAIL: 'email',
  MODERATION: 'moderation',
  CMS_SCHEDULING: 'cms-scheduling',
  RENTAL_REMINDERS: 'rental-reminders',
  RENTAL_EXPIRATION: 'rental-expiration',
  TAXONOMY_CACHE: 'taxonomy-cache',
  AUDIT_LOG: 'audit-log',
  MEILISEARCH_SYNC: 'meilisearch-sync',
  CHAT_SAFETY: 'chat-safety',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

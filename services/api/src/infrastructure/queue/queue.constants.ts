/** BullMQ queue names — domain workers register in later phases. */
export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  SEARCH_INDEX: 'search-index',
  EMAIL: 'email',
  MODERATION: 'moderation',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

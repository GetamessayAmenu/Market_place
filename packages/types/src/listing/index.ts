export { LISTING_CONDITIONS, LISTING_STATUSES } from './listing.js';
export type { ListingStatus, ListingCondition } from './listing.js';
export type { ListingContactOptions } from './contact-options.js';

/** API-facing status labels mapped to Prisma ListingStatus values. */
export const LISTING_STATUS_ALIASES = {
  ACTIVE: 'active',
  SOLD: 'sold',
  HIDDEN: 'archived',
  PENDING: 'pending_review',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

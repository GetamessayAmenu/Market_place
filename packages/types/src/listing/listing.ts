export const LISTING_STATUSES = [
  'draft',
  'pending_review',
  'changes_requested',
  'active',
  'sold',
  'expired',
  'rejected',
  'archived',
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LISTING_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;

export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

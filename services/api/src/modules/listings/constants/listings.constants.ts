export const LISTING_EVENTS = {
  CREATED: 'listing.created',
  UPDATED: 'listing.updated',
  DELETED: 'listing.deleted',
  VIEWED: 'listing.viewed',
  SOLD: 'listing.sold',
  RENEWED: 'listing.renewed',
  FAVORITED: 'listing.favorited',
  UNFAVORITED: 'listing.unfavorited',
  CONTACT_CLICKED: 'listing.contact_clicked',
  MODERATION_FLAGGED: 'listing.moderation_flagged',
  SPAM_SUSPECTED: 'listing.spam_suspected',
} as const;

export const LISTING_CACHE_KEYS = {
  POPULAR: 'mp:listings:popular',
  HOMEPAGE: 'mp:listings:homepage',
  CATEGORY_PREFIX: 'mp:listings:category:',
} as const;

export const LISTING_UPLOAD_FOLDER = 'marketplace/listings' as const;

export const RATE_LIMIT_LISTINGS_PREFIX = 'listings' as const;

/** Application-wide constants (no secrets). */

export const APP_NAME = 'Marketplace' as const;

export const API_VERSION = 'v1' as const;

export const DEFAULT_PAGE_SIZE = 20 as const;

export const MAX_PAGE_SIZE = 100 as const;

export const MAX_LISTING_IMAGES = 12 as const;

/** 5 MiB */
export const MAX_LISTING_IMAGE_BYTES = 5_242_880 as const;

export const ALLOWED_LISTING_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const LISTING_DEFAULT_TTL_DAYS = 30 as const;

export const LISTING_SLUG_MAX_LENGTH = 220 as const;

export const SEARCH_MAX_QUERY_LENGTH = 200 as const;

export const SEARCH_SUGGESTIONS_MAX_LIMIT = 10 as const;

export const LISTINGS_SEARCH_INDEX_UID = 'listings' as const;

export const MAX_CHAT_MESSAGE_LENGTH = 4000 as const;

export const CHAT_TYPING_TTL_MS = 5000 as const;

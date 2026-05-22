/** Application-wide constants (no secrets). */

export const APP_NAME = 'Marketplace' as const;

export const API_VERSION = 'v1' as const;

export const DEFAULT_PAGE_SIZE = 20 as const;

export const MAX_PAGE_SIZE = 100 as const;

export const MAX_LISTING_IMAGES = 12 as const;

export const JWT_ACCESS_EXPIRY = '15m' as const;

export const JWT_REFRESH_EXPIRY = '7d' as const;

export const RATE_LIMIT_WINDOW_MS = 60_000 as const;

export const RATE_LIMIT_MAX_REQUESTS = 100 as const;

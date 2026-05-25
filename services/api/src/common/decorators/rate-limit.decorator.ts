import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  readonly limit: number;
  readonly windowMs: number;
  readonly keyPrefix?: string;
}

export const RateLimit = (options: RateLimitOptions): ReturnType<typeof SetMetadata> =>
  SetMetadata(RATE_LIMIT_KEY, options);

import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../infrastructure/redis/redis.service';
import { LISTING_CACHE_KEYS } from '../constants/listings.constants';

/**
 * Redis cache hooks for listing feeds — invalidate on writes; full caching in a later phase.
 */
@Injectable()
export class ListingsCacheService {
  constructor(private readonly redis: RedisService) {}

  async invalidatePopular(): Promise<void> {
    await this.redis.del(LISTING_CACHE_KEYS.POPULAR);
  }

  async invalidateHomepage(): Promise<void> {
    await this.redis.del(LISTING_CACHE_KEYS.HOMEPAGE);
  }

  async invalidateCategory(categoryId: string): Promise<void> {
    await this.redis.del(`${LISTING_CACHE_KEYS.CATEGORY_PREFIX}${categoryId}`);
  }

  async invalidateAllForListing(categoryId: string): Promise<void> {
    await Promise.all([
      this.invalidatePopular(),
      this.invalidateHomepage(),
      this.invalidateCategory(categoryId),
    ]);
  }

  /** Placeholder for homepage feed cache (Phase 5+). */
  async getHomepagePlaceholder(): Promise<null> {
    const cached = await this.redis.get(LISTING_CACHE_KEYS.HOMEPAGE);
    return cached ? null : null;
  }
}

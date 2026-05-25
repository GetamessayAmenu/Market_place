import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { RATE_LIMIT_CHAT_PREFIX } from '../events.constants';
import { RedisService } from '../infrastructure/redis/redis.service';

@Injectable()
export class ChatRateLimitService {
  constructor(private readonly redis: RedisService) {}

  async assertWithinLimit(
    userId: string,
    action: string,
    limit: number,
    windowMs: number,
  ): Promise<void> {
    const key = `mp:ratelimit:${RATE_LIMIT_CHAT_PREFIX}:${action}:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.pexpire(key, windowMs);
    }
    if (count > limit) {
      throw new HttpException(
        { code: 'CHAT_RATE_LIMIT', message: 'Too many chat actions' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

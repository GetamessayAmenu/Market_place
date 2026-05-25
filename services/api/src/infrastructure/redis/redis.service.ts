import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { ApiConfigService } from '../config/api-config.service';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(config: ApiConfigService) {
    super(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }

  async pingHealth(): Promise<boolean> {
    const result = await this.ping();
    return result === 'PONG';
  }
}

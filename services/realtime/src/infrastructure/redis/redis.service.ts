import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { RealtimeConfigService } from '../config/realtime-config.service';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(config: RealtimeConfigService) {
    super(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }
}

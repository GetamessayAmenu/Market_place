import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import type { HealthCheckResultDto } from './dto/health-check-result.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthCheckResultDto> {
    const [database, redis] = await Promise.all([
      this.prisma.ping().then(() => 'up' as const).catch(() => 'down' as const),
      this.redis.pingHealth().then(() => 'up' as const).catch(() => 'down' as const),
    ]);

    const status = database === 'up' && redis === 'up' ? 'ok' : 'degraded';

    return {
      status,
      checks: {
        database,
        redis,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

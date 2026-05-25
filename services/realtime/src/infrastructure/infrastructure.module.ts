import { Global, Module } from '@nestjs/common';

import { RealtimeConfigModule } from './config/realtime-config.module';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
  imports: [RealtimeConfigModule, PrismaModule, RedisModule],
  exports: [RealtimeConfigModule, PrismaModule, RedisModule],
})
export class InfrastructureModule {}

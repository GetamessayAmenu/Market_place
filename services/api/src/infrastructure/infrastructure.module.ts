import { Global, Module } from '@nestjs/common';

import { ApiConfigModule } from './config/api-config.module';
import { PrismaModule } from './database/prisma.module';
import { EventsInfrastructureModule } from './events/events.module';
import { LoggingModule } from './logging/logging.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
  imports: [
    ApiConfigModule,
    LoggingModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    EventsInfrastructureModule,
  ],
  exports: [
    ApiConfigModule,
    LoggingModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    EventsInfrastructureModule,
  ],
})
export class InfrastructureModule {}

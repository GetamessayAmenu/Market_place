import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ApiConfigService } from '../config/api-config.service';
import { QUEUE_NAMES } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ApiConfigService],
      useFactory: (config: ApiConfigService) => ({
        connection: {
          url: config.redisUrl,
        },
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.SEARCH_INDEX },
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.MODERATION },
      { name: QUEUE_NAMES.CMS_SCHEDULING },
      { name: QUEUE_NAMES.RENTAL_REMINDERS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}

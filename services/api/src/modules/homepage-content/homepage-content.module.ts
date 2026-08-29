import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { HomepageContentController } from './homepage-content.controller';
import { HomepageContentService } from './homepage-content.service';
import { HomepageContentRepository } from './homepage-content.repository';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { UploadsModule } from '../uploads/uploads.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { CmsSchedulingProcessor } from './processors/cms-scheduling.processor';
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';

import { HomepageCmsController } from './homepage-cms.controller';
import { HomepageCmsService } from './homepage-cms.service';

@Module({
  imports: [
    AdminLogsModule,
    UploadsModule,
    EventEmitterModule,
    QueueModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.CMS_SCHEDULING }),
  ],
  controllers: [HomepageContentController, HomepageCmsController],
  providers: [HomepageContentService, HomepageCmsService, HomepageContentRepository, CmsSchedulingProcessor],
  exports: [HomepageContentService, HomepageCmsService],
})
export class HomepageContentModule {}

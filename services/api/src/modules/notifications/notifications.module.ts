import { Module } from '@nestjs/common';

import { QueueModule } from '../../infrastructure/queue/queue.module';
import { EventsInfrastructureModule } from '../../infrastructure/events/events.module';
import { EventsModule } from '../events/events.module';
import { ListingsModule } from '../listings/listings.module';
import { NotificationEventListener } from './listeners/notification-event.listener';
import { NotificationQueueProcessor } from './processors/notification-queue.processor';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [EventsInfrastructureModule, EventsModule, QueueModule, ListingsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationEventListener, NotificationQueueProcessor],
  exports: [NotificationsService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NotificationsModule {}

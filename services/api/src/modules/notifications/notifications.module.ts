import { Module, forwardRef } from '@nestjs/common';

import { QueueModule } from '../../infrastructure/queue/queue.module';
import { EventsInfrastructureModule } from '../../infrastructure/events/events.module';
import { EventsModule } from '../events/events.module';
import { ListingsModule } from '../listings/listings.module';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsRepository } from './broadcasts.repository';
import { BroadcastsService } from './broadcasts.service';
import { InAppChannel } from './channels/in-app.channel';
import { NotificationEventListener } from './listeners/notification-event.listener';
import { NotificationPreferencesRepository } from './notification-preferences.repository';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { BroadcastQueueProcessor } from './processors/broadcast-queue.processor';
import { NotificationQueueProcessor } from './processors/notification-queue.processor';

@Module({
  imports: [EventsInfrastructureModule, EventsModule, QueueModule, forwardRef(() => ListingsModule)],
  controllers: [NotificationsController, BroadcastsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationPreferencesService,
    NotificationPreferencesRepository,
    BroadcastsService,
    BroadcastsRepository,
    InAppChannel,
    NotificationEventListener,
    NotificationQueueProcessor,
    BroadcastQueueProcessor,
  ],
  exports: [NotificationsService, NotificationPreferencesService, BroadcastsService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NotificationsModule {}

import { Module } from '@nestjs/common';

import { WebsocketModule } from '../websocket/websocket.module';
import { ListingModerationListener } from './listing-moderation.listener';
import { NotificationsGateway } from './notifications.gateway';
import { OrderEventsListener } from './order-events.listener';
import { RealtimeNotificationListener } from './realtime-notification.listener';

@Module({
  imports: [WebsocketModule],
  providers: [
    NotificationsGateway,
    ListingModerationListener,
    OrderEventsListener,
    RealtimeNotificationListener,
  ],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}

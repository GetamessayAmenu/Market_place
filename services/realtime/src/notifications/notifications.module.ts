import { Module } from '@nestjs/common';

import { WebsocketModule } from '../websocket/websocket.module';
import { ListingModerationListener } from './listing-moderation.listener';
import { OrderEventsListener } from './order-events.listener';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [WebsocketModule],
  providers: [NotificationsGateway, ListingModerationListener, OrderEventsListener],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}

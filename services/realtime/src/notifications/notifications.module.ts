import { Module } from '@nestjs/common';

import { WebsocketModule } from '../websocket/websocket.module';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [WebsocketModule],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}

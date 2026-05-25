import { Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';
import { PresenceModule } from '../presence/presence.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { ChatGateway } from './chat.gateway';
import { ChatRateLimitService } from './chat-rate-limit.service';

@Module({
  imports: [WebsocketModule, PresenceModule, ChatModule],
  providers: [ChatGateway, ChatRateLimitService],
  exports: [ChatGateway],
})
export class GatewayModule {}

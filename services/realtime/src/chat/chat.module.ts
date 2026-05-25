import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PresenceModule } from '../presence/presence.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { HttpAuthGuard } from '../websocket/http-auth.guard';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatModerationListener } from './listeners/chat-moderation.listener';

@Module({
  imports: [EventEmitterModule.forRoot(), WebsocketModule, PresenceModule],
  controllers: [ChatController],
  providers: [
    ChatRepository,
    ChatService,
    ChatModerationListener,
    HttpAuthGuard,
  ],
  exports: [ChatService, ChatRepository],
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatSafetyService } from './chat.safety.service';
import { ChatController } from './chat.controller';
import { ConversationsRepository } from './conversations.repository';
import { MessagesRepository } from './messages.repository';
import { ChatSafetyQueueProcessor } from './processors/chat-safety-queue.processor';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [InfrastructureModule, AuthModule, NotificationsModule],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatSafetyService,
    ConversationsRepository,
    MessagesRepository,
    ChatSafetyQueueProcessor,
  ],
  exports: [ChatService, ChatSafetyService, ConversationsRepository, MessagesRepository],
})
export class ChatModule {}

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CHAT_DOMAIN_EVENTS } from '../events.constants';
import type { SocketUser } from '../websocket/interfaces/socket-user.interface';
import { PresenceService } from '../presence/presence.service';
import { RealtimeConfigService } from '../infrastructure/config/realtime-config.service';
import { ChatRepository } from './chat.repository';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { PaginationQueryDto } from './dto/pagination-query.dto';
import type { ReadReceiptDto } from './dto/read-receipt.dto';
import type { SendMessageDto } from './dto/send-message.dto';
import {
  ChatNotAllowedException,
  ConversationForbiddenException,
  ConversationNotFoundException,
} from './exceptions/chat.exceptions';
import {
  ChatMessageSentEvent,
  ChatSpamSuspectedEvent,
} from './events/chat.domain-events';
import {
  serializeConversation,
  serializeMessage,
  type SerializedMessage,
} from './utils/chat-serializer.util';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly presenceService: PresenceService,
    private readonly config: RealtimeConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createConversation(user: SocketUser, dto: CreateConversationDto) {
    if (user.status === 'suspended' || user.status === 'banned') {
      throw new ChatNotAllowedException('Your account cannot start conversations');
    }

    const listing = await this.chatRepository.findListingForChat(dto.listingId);
    if (!listing) {
      throw new ConversationNotFoundException();
    }

    if (listing.sellerId === user.id) {
      throw new ChatNotAllowedException('Sellers cannot start a conversation on their own listing');
    }

    const existing = await this.chatRepository.findConversationByParticipants(
      dto.listingId,
      user.id,
      listing.sellerId,
    );

    if (existing) {
      const full = await this.chatRepository.findConversationById(existing.id);
      return serializeConversation(full!);
    }

    const conversation = await this.chatRepository.createConversation({
      listingId: dto.listingId,
      buyerId: user.id,
      sellerId: listing.sellerId,
    });

    return serializeConversation(conversation);
  }

  async listConversations(user: SocketUser, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.chatRepository.listConversationsForUser(user.id, {
      page,
      limit,
    });

    const items = await Promise.all(
      result.items.map(async (conversation) => {
        const [unreadCount, lastMessage] = await Promise.all([
          this.chatRepository.countUnreadMessages(conversation.id, user.id),
          this.chatRepository.getLatestMessage(conversation.id),
        ]);
        return serializeConversation(conversation, { unreadCount, lastMessage });
      }),
    );

    const totalPages = Math.ceil(result.total / limit) || 0;

    return {
      data: items,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getMessageHistory(
    user: SocketUser,
    conversationId: string,
    query: PaginationQueryDto,
  ) {
    const conversation = await this.assertParticipant(conversationId, user.id);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.chatRepository.listMessages(conversation.id, {
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit) || 0;

    return {
      data: result.items.map(serializeMessage).reverse(),
      meta: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async sendMessage(user: SocketUser, dto: SendMessageDto): Promise<SerializedMessage> {
    await this.assertCanSend(user);
    this.validateMessageBody(dto.body);

    const conversation = await this.assertParticipant(dto.conversationId, user.id);
    const recipientId = this.chatRepository.getOtherParticipantId(conversation, user.id);

    const message = await this.chatRepository.createMessage({
      conversationId: conversation.id,
      senderId: user.id,
      body: dto.body.trim(),
    });

    await this.presenceService.incrementUnread(recipientId, conversation.id);
    this.detectSpam(dto.body, conversation.id, user.id);
    this.eventEmitter.emit(
      CHAT_DOMAIN_EVENTS.MESSAGE_SENT,
      new ChatMessageSentEvent(
        message.id,
        conversation.id,
        user.id,
        recipientId,
      ),
    );

    return serializeMessage(message);
  }

  async markRead(user: SocketUser, dto: ReadReceiptDto) {
    await this.assertParticipant(dto.conversationId, user.id);
    const count = await this.chatRepository.markMessagesRead(
      dto.conversationId,
      user.id,
      dto.messageIds,
    );
    await this.presenceService.resetUnread(user.id, dto.conversationId);

    return { conversationId: dto.conversationId, markedCount: count };
  }

  async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.chatRepository.findConversationById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundException();
    }
    if (!this.chatRepository.isParticipant(conversation, userId)) {
      throw new ConversationForbiddenException();
    }
    return conversation;
  }

  private async assertCanSend(user: SocketUser): Promise<void> {
    if (user.status === 'suspended' || user.status === 'banned') {
      throw new ChatNotAllowedException('Your account is suspended or banned.');
    }

    const restriction = await this.chatRepository.checkActiveMessagingRestriction(user.id);
    if (restriction) {
      const expireStr = restriction.expiresAt
        ? ` until ${new Date(restriction.expiresAt).toLocaleDateString()}`
        : '';
      throw new ChatNotAllowedException(
        `Messaging restricted (${restriction.type})${expireStr}: ${restriction.reason}`,
      );
    }
  }

  private validateMessageBody(body: string): void {
    const trimmed = body.trim();
    if (!trimmed.length) {
      throw new ChatNotAllowedException('Message cannot be empty');
    }
    if (trimmed.length > this.config.maxMessageLength) {
      throw new ChatNotAllowedException(
        `Message exceeds maximum length of ${this.config.maxMessageLength}`,
      );
    }
  }

  private detectSpam(body: string, conversationId: string, senderId: string): void {
    if (/(.)\1{15,}/.test(body) || body.length > this.config.maxMessageLength * 0.95) {
      this.eventEmitter.emit(
        CHAT_DOMAIN_EVENTS.SPAM_SUSPECTED,
        new ChatSpamSuspectedEvent(conversationId, senderId, 'pattern_match'),
      );
    }
  }

  async verifyOrderAccess(orderId: string, userId: string) {
    return this.chatRepository.findOrderByUser(orderId, userId);
  }

  async sendMessageSimple(data: {
    conversationId: string;
    senderId: string;
    body: string;
  }) {
    const message = await this.chatRepository.createMessage(data);
    this.detectSpam(data.body, data.conversationId, data.senderId);
    return message;
  }
}

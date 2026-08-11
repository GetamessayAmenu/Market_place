import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ConversationsRepository } from './conversations.repository';
import { MessagesRepository } from './messages.repository';
import { NotificationsService } from '../notifications/notifications.service';

export interface SerializedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface SerializedConversation {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
  seller: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
    images: any[];
  } | null;
  lastMessage: SerializedMessage | null;
  messageCount: number;
  unreadCount: number;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getConversations(
    user: AuthenticatedUser,
    role: 'buyer' | 'seller'
  ): Promise<SerializedConversation[]> {
    const conversations = await this.conversationsRepository.findUserConversations(user.id, role);

    const serialized = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.messagesRepository.getUnreadCount(conv.id, user.id);
        return this.serializeConversation(conv, unreadCount);
      })
    );

    return serialized;
  }

  async getConversation(id: string, user: AuthenticatedUser): Promise<SerializedConversation> {
    const conversation = await this.conversationsRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is part of the conversation
    if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this conversation');
    }

    const unreadCount = await this.messagesRepository.getUnreadCount(id, user.id);
    return this.serializeConversation(conversation, unreadCount);
  }

  async getMessages(
    conversationId: string,
    user: AuthenticatedUser,
    limit = 50,
    offset = 0
  ): Promise<SerializedMessage[]> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is part of the conversation
    if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this conversation');
    }

    const messages = await this.messagesRepository.findByConversation(conversationId, limit, offset);
    return messages.map((msg) => this.serializeMessage(msg));
  }

  async findOrCreateConversation(
    user: AuthenticatedUser,
    sellerId: string,
    listingId?: string
  ): Promise<SerializedConversation> {
    if (user.id === sellerId) {
      throw new ForbiddenException('Cannot start conversation with yourself');
    }

    const role = user.role === 'seller' ? 'seller' : 'buyer';
    const buyerId = role === 'buyer' ? user.id : sellerId;
    const actualSellerId = role === 'seller' ? user.id : sellerId;

    // Check if conversation already exists
    let conversation = await this.conversationsRepository.findByParticipants(
      buyerId,
      actualSellerId,
      listingId
    );

    if (!conversation) {
      conversation = await this.conversationsRepository.create({
        buyerId,
        sellerId: actualSellerId,
        ...(listingId && { listingId }),
      });

      // Notify the other party
      const recipientId = user.id === buyerId ? actualSellerId : buyerId;
      await this.notificationsService.createCustomNotification(
        recipientId,
        'new_message',
        'New conversation started',
        'Someone started a conversation with you',
        { conversationId: conversation.id }
      );
    }

    if (!conversation) {
      throw new NotFoundException('Failed to create conversation');
    }

    const unreadCount = await this.messagesRepository.getUnreadCount(conversation.id, user.id);
    return this.serializeConversation(conversation, unreadCount);
  }

  async sendMessage(
    conversationId: string,
    user: AuthenticatedUser,
    body: string
  ): Promise<SerializedMessage> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is part of the conversation
    if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to send messages in this conversation');
    }

    const message = await this.messagesRepository.create({
      conversationId,
      senderId: user.id,
      body,
    });

    // Update conversation timestamp
    await this.conversationsRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    // Notify the other party
    const recipientId = conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId;
    await this.notificationsService.createCustomNotification(
      recipientId,
      'new_message',
      'New message received',
      body.substring(0, 100),
      { conversationId, messageId: message.id }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('chat.message_sent', {
      conversationId,
      messageId: message.id,
      senderId: user.id,
      recipientId,
      body,
    });

    return this.serializeMessage(message);
  }

  async markAsRead(conversationId: string, user: AuthenticatedUser): Promise<void> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is part of the conversation
    if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to mark this conversation as read');
    }

    await this.conversationsRepository.markMessagesAsRead(conversationId, user.id);
  }

  async getUnreadCount(user: AuthenticatedUser): Promise<number> {
    return this.conversationsRepository.getUnreadCount(user.id);
  }

  private serializeConversation(conv: any, unreadCount: number = 0): SerializedConversation {
    return {
      id: conv.id,
      buyerId: conv.buyerId,
      sellerId: conv.sellerId,
      listingId: conv.listingId,
      lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      buyer: conv.buyer,
      seller: conv.seller,
      listing: conv.listing,
      lastMessage: conv.messages && conv.messages[0] ? this.serializeMessage(conv.messages[0]) : null,
      messageCount: conv._count?.messages || 0,
      unreadCount,
    };
  }

  private serializeMessage(msg: any): SerializedMessage {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      body: msg.body,
      readAt: msg.readAt?.toISOString() ?? null,
      createdAt: msg.createdAt.toISOString(),
      sender: msg.sender,
    };
  }
}

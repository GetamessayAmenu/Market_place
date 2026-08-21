import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ConversationsRepository } from './conversations.repository';
import { MessagesRepository } from './messages.repository';
import { NotificationsService } from '../notifications/notifications.service';

export interface SerializedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
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
  listingId: string | null;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  isFlagged: boolean;
  deletedAt: string | null;
  buyer: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  seller: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    images: any[];
  } | null;
  lastMessage: SerializedMessage | null;
  messageCount: number;
  unreadCount: number;
  customOrder?: {
    id: string;
    type: string;
    status: string;
    measurements?: any;
    rentalStartDate?: string;
    rentalEndDate?: string;
    agreedPrice?: number;
  };
}

@Injectable()
export class ChatService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly notificationsService: NotificationsService,
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
    content: string
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
      content,
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
      content.substring(0, 100),
      { conversationId, messageId: message.id }
    );

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

  async getSellerConversations(
    user: AuthenticatedUser,
    filter?: 'all' | 'unread' | 'sales_custom' | 'rentals' | 'quotes' | 'archived'
  ): Promise<SerializedConversation[]> {
    const conversations = await this.conversationsRepository.findUserConversations(user.id, 'seller');

    const serialized = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.messagesRepository.getUnreadCount(conv.id, user.id);
        return this.serializeConversation(conv, unreadCount);
      })
    );

    // Apply filters
    let filtered = serialized;
    if (filter === 'unread') {
      filtered = serialized.filter((conv) => conv.unreadCount > 0);
    } else if (filter === 'sales_custom') {
      filtered = serialized.filter((conv) => {
        const isSale = conv.customOrder?.type === 'SALE';
        const isCustom = conv.customOrder?.type === 'CUSTOM_TAILORING';
        return isSale || isCustom;
      });
    } else if (filter === 'rentals') {
      filtered = serialized.filter((conv) => conv.customOrder?.type === 'RENTAL');
    } else if (filter === 'quotes') {
      // Filter conversations that have quote messages
      filtered = serialized.filter((conv) => {
        // Check if last message contains quote metadata
        return conv.lastMessage?.content?.includes('custom_quote') || false;
      });
    } else if (filter === 'archived') {
      // Filter conversations with completed/archived orders
      filtered = serialized.filter((conv) => {
        const isCompleted = conv.customOrder?.status === 'COMPLETED' || conv.customOrder?.status === 'ARCHIVED';
        return isCompleted;
      });
    }

    return filtered;
  }

  async archiveConversation(conversationId: string, user: AuthenticatedUser): Promise<{ success: boolean }> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is the seller
    if (conversation.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can archive conversations');
    }

    // Soft delete by setting deletedAt
    await this.conversationsRepository.update(conversationId, {
      deletedAt: new Date(),
    });

    return { success: true };
  }

  async sendQuote(
    conversationId: string,
    user: AuthenticatedUser,
    quoteData: { proposedPrice: number; proposedDeposit?: number; notes?: string }
  ): Promise<SerializedMessage> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is the seller
    if (conversation.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can send quotes');
    }

    // Send quote as a structured message
    const quoteMessage = JSON.stringify({
      type: 'custom_quote',
      ...quoteData,
      senderId: user.id,
      senderName: user.email.split('@')[0],
      timestamp: new Date().toISOString(),
    });

    const message = await this.messagesRepository.create({
      conversationId,
      senderId: user.id,
      content: quoteMessage,
    });

    // Update conversation timestamp
    await this.conversationsRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    // Notify the buyer
    await this.notificationsService.createCustomNotification(
      conversation.buyerId,
      'new_quote',
      'New quote received',
      `Seller sent a quote of ${quoteData.proposedPrice} ETB`,
      { conversationId, quoteData }
    );

    return this.serializeMessage(message);
  }

  async acceptQuote(
    conversationId: string,
    quoteId: string,
    user: AuthenticatedUser
  ): Promise<SerializedMessage> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is the buyer
    if (conversation.buyerId !== user.id) {
      throw new ForbiddenException('Only buyers can accept quotes');
    }

    // Send acceptance message
    const acceptMessage = JSON.stringify({
      type: 'quote_accepted',
      quoteId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
    });

    const message = await this.messagesRepository.create({
      conversationId,
      senderId: user.id,
      content: acceptMessage,
    });

    // Update conversation timestamp
    await this.conversationsRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    // Notify the seller
    await this.notificationsService.createCustomNotification(
      conversation.sellerId,
      'quote_accepted',
      'Quote accepted',
      'Buyer accepted your quote',
      { conversationId, quoteId }
    );

    return this.serializeMessage(message);
  }

  private serializeConversation(conv: any, unreadCount: number = 0): SerializedConversation {
    return {
      id: conv.id,
      listingId: conv.listingId,
      buyerId: conv.buyerId,
      sellerId: conv.sellerId,
      lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      isFlagged: conv.isFlagged || false,
      deletedAt: conv.deletedAt ? conv.deletedAt.toISOString() : null,
      buyer: conv.buyer,
      seller: conv.seller,
      listing: conv.listing,
      lastMessage: conv.messages && conv.messages[0] ? this.serializeMessage(conv.messages[0]) : null,
      messageCount: conv._count?.messages || 0,
      unreadCount,
      customOrder: (conv.customOrders && conv.customOrders[0] ? {
        id: String(conv.customOrders[0].id),
        type: String(conv.customOrders[0].type),
        status: String(conv.customOrders[0].status),
        measurements: conv.customOrders[0].measurements,
        rentalStartDate: conv.customOrders[0].rentalStartDate ? conv.customOrders[0].rentalStartDate.toISOString() : undefined,
        rentalEndDate: conv.customOrders[0].rentalEndDate ? conv.customOrders[0].rentalEndDate.toISOString() : undefined,
        agreedPrice: conv.customOrders[0].agreedPrice ? Number(conv.customOrders[0].agreedPrice) : undefined,
      } : undefined) as any,
    };
  }

  private serializeMessage(msg: any): SerializedMessage {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content || msg.body,
      readAt: msg.readAt?.toISOString() ?? null,
      createdAt: msg.createdAt.toISOString(),
      sender: msg.sender,
    };
  }
}

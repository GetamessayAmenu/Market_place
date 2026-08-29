import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ConversationsRepository } from './conversations.repository';
import { MessagesRepository } from './messages.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { MessageType } from '@prisma/client';

export interface SerializedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachments?: any;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    senderName: string;
  } | null;
  readAt: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  deliveryStatus: string;
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
  orderId?: string | null;
  rentalId?: string | null;
  customOrderId?: string | null;
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
    status: string;
    images: any[];
  } | null;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    agreedPrice: number;
    type: string;
  } | null;
  rental?: {
    id: string;
    orderNumber: string;
    status: string;
    startDate: string;
    endDate: string;
    dailyRate: number;
    totalAmount: number;
  } | null;
  customOrderRef?: {
    id: string;
    status: string;
    agreedPrice?: number | null;
    selectedColor?: string | null;
    selectedFabric?: string | null;
    selectedSize?: string | null;
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

    if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this conversation');
    }

    const messages = await this.messagesRepository.findByConversation(conversationId, limit, offset);
    return messages.map((msg) => this.serializeMessage(msg));
  }

  async findOrCreateConversation(
    user: AuthenticatedUser,
    sellerId: string,
    context?: { listingId?: string; orderId?: string; rentalId?: string; customOrderId?: string }
  ): Promise<SerializedConversation> {
    if (user.id === sellerId) {
      throw new ForbiddenException('Cannot start conversation with yourself');
    }

    // Verify seller exists
    const sellerExists = await this.conversationsRepository.userExists(sellerId);
    if (!sellerExists) {
      throw new NotFoundException('Seller user account not found');
    }

    // Check block status
    const isBlocked = await this.conversationsRepository.isUserBlocked(user.id, sellerId);
    if (isBlocked) {
      throw new ForbiddenException('Cannot start or view conversation with blocked user');
    }

    const buyerId = user.id;
    const actualSellerId = sellerId;

    let conversation = await this.conversationsRepository.findByParticipants(
      buyerId,
      actualSellerId,
      context
    );

    if (!conversation) {
      const createConvPayload: { buyerId: string; sellerId: string; listingId?: string; orderId?: string; rentalId?: string; customOrderId?: string } = {
        buyerId,
        sellerId: actualSellerId,
      };
      if (context?.listingId) createConvPayload.listingId = context.listingId;
      if (context?.orderId) createConvPayload.orderId = context.orderId;
      if (context?.rentalId) createConvPayload.rentalId = context.rentalId;
      if (context?.customOrderId) createConvPayload.customOrderId = context.customOrderId;

      conversation = await this.conversationsRepository.create(createConvPayload);

      // Notify seller (non-blocking)
      try {
        await this.notificationsService.createCustomNotification(
          actualSellerId,
          'new_message',
          'New conversation started',
          'A buyer started a conversation with you',
          { conversationId: conversation.id }
        );
      } catch {
        // Ignore notification errors
      }
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
    payload: {
      content: string;
      messageType?: MessageType;
      attachments?: any;
      replyToId?: string;
    }
  ): Promise<SerializedMessage> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to send messages in this conversation');
    }

    const recipientId = conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId;

    // Check block status
    const isBlocked = await this.conversationsRepository.isUserBlocked(user.id, recipientId);
    if (isBlocked) {
      throw new ForbiddenException('Cannot send message: user is blocked');
    }

    if (!payload.content && !payload.attachments) {
      throw new BadRequestException('Message cannot be empty');
    }

    const createMsgPayload: { conversationId: string; senderId: string; content: string; messageType?: MessageType; attachments?: any; replyToId?: string } = {
      conversationId,
      senderId: user.id,
      content: payload.content || '',
      messageType: payload.messageType || 'TEXT',
    };
    if (payload.attachments) createMsgPayload.attachments = payload.attachments;
    if (payload.replyToId) createMsgPayload.replyToId = payload.replyToId;

    const message = await this.messagesRepository.create(createMsgPayload);

    await this.conversationsRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    // Notify recipient (non-blocking)
    try {
      await this.notificationsService.createCustomNotification(
        recipientId,
        'new_message',
        'New message received',
        (payload.content || 'Sent an attachment').substring(0, 100),
        { conversationId, messageId: message.id }
      );
    } catch {
      // Ignore notification errors
    }

    return this.serializeMessage(message);
  }

  async editMessage(
    messageId: string,
    user: AuthenticatedUser,
    newContent: string
  ): Promise<SerializedMessage> {
    const message = await this.messagesRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== user.id) {
      throw new ForbiddenException('Can only edit your own messages');
    }

    if (!newContent.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const updated = await this.messagesRepository.update(messageId, {
      content: newContent,
      editedAt: new Date(),
    });

    return this.serializeMessage(updated);
  }

  async deleteMessage(messageId: string, user: AuthenticatedUser): Promise<{ success: boolean }> {
    const message = await this.messagesRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== user.id) {
      throw new ForbiddenException('Can only delete your own messages');
    }

    await this.messagesRepository.softDelete(messageId);
    return { success: true };
  }

  async markAsRead(conversationId: string, user: AuthenticatedUser): Promise<void> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.buyerId !== user.id && conversation.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to mark this conversation as read');
    }

    await this.conversationsRepository.markMessagesAsRead(conversationId, user.id);
  }

  async getUnreadCount(user: AuthenticatedUser): Promise<number> {
    return this.conversationsRepository.getUnreadCount(user.id);
  }

  // ─── Block & Report Controls ─────────────────────────────────────────────

  async blockUser(user: AuthenticatedUser, targetUserId: string, reason?: string) {
    if (user.id === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }
    await this.conversationsRepository.blockUser(user.id, targetUserId, reason);
    return { success: true };
  }

  async unblockUser(user: AuthenticatedUser, targetUserId: string) {
    await this.conversationsRepository.unblockUser(user.id, targetUserId);
    return { success: true };
  }

  async getBlockedUsers(user: AuthenticatedUser) {
    return this.conversationsRepository.getBlockedUsers(user.id);
  }

  async reportMessageOrUser(
    user: AuthenticatedUser,
    params: {
      targetType: 'message' | 'user' | 'conversation';
      reportedUserId?: string;
      messageId?: string;
      conversationId?: string;
      reason: string;
      description?: string;
    }
  ) {
    return this.conversationsRepository.createReport({
      reporterId: user.id,
      ...params,
    });
  }

  async searchMessages(user: AuthenticatedUser, query: string) {
    const messages = await this.messagesRepository.searchMessages(user.id, query);
    return messages.map((m) => this.serializeMessage(m));
  }

  private serializeConversation(conv: any, unreadCount: number = 0): SerializedConversation {
    const toIsoString = (val: any) => {
      if (!val) return new Date().toISOString();
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return new Date(val).toISOString();
      return new Date().toISOString();
    };

    return {
      id: conv.id,
      listingId: conv.listingId ?? null,
      orderId: conv.orderId ?? null,
      rentalId: conv.rentalId ?? null,
      customOrderId: conv.customOrderId ?? null,
      buyerId: conv.buyerId,
      sellerId: conv.sellerId,
      lastMessageAt: conv.lastMessageAt ? toIsoString(conv.lastMessageAt) : null,
      createdAt: toIsoString(conv.createdAt),
      updatedAt: toIsoString(conv.updatedAt),
      isFlagged: Boolean(conv.isFlagged),
      deletedAt: conv.deletedAt ? toIsoString(conv.deletedAt) : null,
      buyer: conv.buyer ? {
        id: conv.buyer.id,
        displayName: conv.buyer.displayName || conv.buyer.email || 'Buyer',
        avatarUrl: conv.buyer.avatarUrl || null,
        email: conv.buyer.email || '',
        phone: conv.buyer.phone || null,
      } : { id: conv.buyerId, displayName: 'Buyer', email: '', phone: null, avatarUrl: null },
      seller: conv.seller ? {
        id: conv.seller.id,
        displayName: conv.seller.displayName || conv.seller.email || 'Seller',
        avatarUrl: conv.seller.avatarUrl || null,
        email: conv.seller.email || '',
        phone: conv.seller.phone || null,
      } : { id: conv.sellerId, displayName: 'Seller', email: '', phone: null, avatarUrl: null },
      listing: conv.listing ? {
        id: conv.listing.id,
        title: conv.listing.title || 'Untitled Listing',
        slug: conv.listing.slug || '',
        price: conv.listing.price ? Number(conv.listing.price) : 0,
        currency: conv.listing.currency || 'ETB',
        status: conv.listing.status || 'ACTIVE',
        images: Array.isArray(conv.listing.images) ? conv.listing.images : [],
      } : null,
      order: conv.order ? {
        id: conv.order.id,
        orderNumber: conv.order.orderNumber || '',
        status: conv.order.status || '',
        agreedPrice: conv.order.agreedPrice ? Number(conv.order.agreedPrice) : 0,
        type: conv.order.type || '',
      } : null,
      rental: conv.rental ? {
        id: conv.rental.id,
        orderNumber: conv.rental.orderNumber || '',
        status: conv.rental.status || '',
        startDate: toIsoString(conv.rental.startDate),
        endDate: toIsoString(conv.rental.endDate),
        dailyRate: conv.rental.dailyRate ? Number(conv.rental.dailyRate) : 0,
        totalAmount: conv.rental.totalAmount ? Number(conv.rental.totalAmount) : 0,
      } : null,
      customOrderRef: conv.customOrderRef ? {
        id: conv.customOrderRef.id,
        status: conv.customOrderRef.status || '',
        agreedPrice: conv.customOrderRef.agreedPrice ? Number(conv.customOrderRef.agreedPrice) : null,
        selectedColor: conv.customOrderRef.selectedColor || null,
        selectedFabric: conv.customOrderRef.selectedFabric || null,
        selectedSize: conv.customOrderRef.selectedSize || null,
      } : null,
      lastMessage: conv.messages && conv.messages[0] ? this.serializeMessage(conv.messages[0]) : null,
      messageCount: conv._count?.messages || 0,
      unreadCount,
    };
  }

  private serializeMessage(msg: any): SerializedMessage {
    const toIsoString = (val: any) => {
      if (!val) return new Date().toISOString();
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return new Date(val).toISOString();
      return new Date().toISOString();
    };

    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content || msg.body || '',
      messageType: msg.messageType || 'TEXT',
      attachments: msg.attachments || null,
      replyToId: msg.replyToId || null,
      replyTo: msg.replyTo ? {
        id: msg.replyTo.id,
        content: msg.replyTo.content || msg.replyTo.body || '',
        senderId: msg.replyTo.senderId,
        createdAt: toIsoString(msg.replyTo.createdAt),
        senderName: msg.replyTo.sender?.displayName || 'User',
      } : null,
      readAt: msg.readAt ? toIsoString(msg.readAt) : null,
      editedAt: msg.editedAt ? toIsoString(msg.editedAt) : null,
      deletedAt: msg.deletedAt ? toIsoString(msg.deletedAt) : null,
      deliveryStatus: msg.deliveryStatus || 'SENT',
      createdAt: toIsoString(msg.createdAt),
      sender: msg.sender ? {
        id: msg.sender.id,
        displayName: msg.sender.displayName || msg.sender.email || 'User',
        avatarUrl: msg.sender.avatarUrl || null,
        email: msg.sender.email || '',
      } : { id: msg.senderId, displayName: 'User', email: '', avatarUrl: null },
    };
  }
}

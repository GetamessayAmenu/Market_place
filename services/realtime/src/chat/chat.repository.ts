import { Injectable } from '@nestjs/common';
import type { Conversation, Message, Prisma } from '@prisma/client';

import { PrismaService } from '../infrastructure/database/prisma.service';

export type ConversationWithParticipants = Conversation & {
  readonly listing: { readonly id: string; readonly title: string; readonly slug: string };
  readonly buyer: { readonly id: string; readonly displayName: string; readonly avatarUrl: string | null };
  readonly seller: { readonly id: string; readonly displayName: string; readonly avatarUrl: string | null };
};

export type MessageWithSender = Message & {
  readonly sender: { readonly id: string; readonly displayName: string; readonly avatarUrl: string | null };
};

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findListingForChat(listingId: string) {
    return this.prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: { id: true, sellerId: true, status: true, title: true },
    });
  }

  async findConversationByParticipants(
    listingId: string,
    buyerId: string,
    sellerId: string,
  ): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: { listingId, buyerId, sellerId, deletedAt: null },
    });
  }

  async findConversationById(id: string): Promise<ConversationWithParticipants | null> {
    return this.prisma.conversation.findFirst({
      where: { id, deletedAt: null },
      include: {
        listing: { select: { id: true, title: true, slug: true } },
        buyer: { select: { id: true, displayName: true, avatarUrl: true } },
        seller: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    }) as Promise<ConversationWithParticipants | null>;
  }

  async createConversation(data: {
    listingId: string;
    buyerId: string;
    sellerId: string;
  }): Promise<ConversationWithParticipants> {
    return this.prisma.conversation.create({
      data,
      include: {
        listing: { select: { id: true, title: true, slug: true } },
        buyer: { select: { id: true, displayName: true, avatarUrl: true } },
        seller: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    }) as Promise<ConversationWithParticipants>;
  }

  async listConversationsForUser(
    userId: string,
    params: { page: number; limit: number },
  ): Promise<{ items: ConversationWithParticipants[]; total: number }> {
    const where: Prisma.ConversationWhereInput = {
      deletedAt: null,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    };
    const skip = (params.page - 1) * params.limit;

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: params.limit,
        include: {
          listing: { select: { id: true, title: true, slug: true } },
          buyer: { select: { id: true, displayName: true, avatarUrl: true } },
          seller: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { items: items as ConversationWithParticipants[], total };
  }

  async getLatestMessage(conversationId: string): Promise<MessageWithSender | null> {
    return this.prisma.message.findFirst({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    }) as Promise<MessageWithSender | null>;
  }

  async countUnreadMessages(conversationId: string, userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        conversationId,
        deletedAt: null,
        readAt: null,
        senderId: { not: userId },
      },
    });
  }

  async listMessages(
    conversationId: string,
    params: { page: number; limit: number },
  ): Promise<{ items: MessageWithSender[]; total: number }> {
    const where = { conversationId, deletedAt: null };
    const skip = (params.page - 1) * params.limit;

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.limit,
        include: {
          sender: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return { items: items as MessageWithSender[], total };
  }

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    body: string;
  }): Promise<MessageWithSender> {
    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data,
        include: {
          sender: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: now },
      }),
    ]);
    return message as MessageWithSender;
  }

  async markMessagesRead(
    conversationId: string,
    readerId: string,
    messageIds?: string[],
  ): Promise<number> {
    const now = new Date();
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        deletedAt: null,
        readAt: null,
        senderId: { not: readerId },
        ...(messageIds?.length ? { id: { in: [...messageIds] } } : {}),
      },
      data: { readAt: now },
    });
    return result.count;
  }

  isParticipant(
    conversation: Pick<Conversation, 'buyerId' | 'sellerId'>,
    userId: string,
  ): boolean {
    return conversation.buyerId === userId || conversation.sellerId === userId;
  }

  getOtherParticipantId(
    conversation: Pick<Conversation, 'buyerId' | 'sellerId'>,
    userId: string,
  ): string {
    return conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
  }

  async findOrderByUser(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    }) as any;
    
    if (!order) return null;

    // Get conversation separately if it exists
    let conversation = null;
    if (order.conversation_id) {
      conversation = await this.prisma.conversation.findUnique({
        where: { id: order.conversation_id },
      });
    }

    return {
      ...order,
      conversation,
      buyer: { id: order.buyerId, displayName: 'Buyer' },
      seller: { id: order.sellerId, displayName: 'Seller' },
    };
  }
}

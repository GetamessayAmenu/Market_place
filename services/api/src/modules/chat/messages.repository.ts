import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MessageType, MessageDeliveryStatus, Prisma } from '@prisma/client';

export interface CreateMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
  attachments?: any;
  replyToId?: string;
  metadata?: any;
}

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get messageInclude() {
    return {
      sender: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          createdAt: true,
          sender: {
            select: { id: true, displayName: true },
          },
        },
      },
    };
  }

  async findById(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
      include: this.messageInclude,
    });
  }

  async findByConversation(conversationId: string, limit = 50, offset = 0) {
    return this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: this.messageInclude,
      orderBy: { createdAt: 'asc' }, // Return chronological order for UI consumption
      take: limit,
      skip: offset,
    });
  }

  async create(data: CreateMessageParams) {
    return this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType || 'TEXT',
        ...(data.attachments ? { attachments: data.attachments } : {}),
        ...(data.replyToId ? { replyToId: data.replyToId } : {}),
        ...(data.metadata ? { metadata: data.metadata } : {}),
        deliveryStatus: 'SENT',
      },
      include: this.messageInclude,
    });
  }

  async update(id: string, data: { content?: string; editedAt?: Date; deletedAt?: Date; deliveryStatus?: MessageDeliveryStatus }) {
    return this.prisma.message.update({
      where: { id },
      data,
      include: this.messageInclude,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.message.update({
      where: { id },
      data: { readAt: new Date(), deliveryStatus: 'READ' },
    });
  }

  async softDelete(id: string) {
    return this.prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getUnreadCount(conversationId: string, userId: string) {
    return this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
        deletedAt: null,
      },
    });
  }

  async searchMessages(userId: string, query: string, limit = 20) {
    return this.prisma.message.findMany({
      where: {
        conversation: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
          deletedAt: null,
        },
        content: { contains: query, mode: 'insensitive' as Prisma.QueryMode },
        deletedAt: null,
      },
      include: this.messageInclude,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

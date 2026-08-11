import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: {
              where: { isPrimary: true, deletedAt: null },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async findByParticipants(buyerId: string, sellerId: string, listingId?: string) {
    return this.prisma.conversation.findFirst({
      where: {
        buyerId,
        sellerId,
        ...(listingId && { listingId }),
      },
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: {
              where: { isPrimary: true, deletedAt: null },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async findUserConversations(userId: string, role: 'buyer' | 'seller') {
    const where = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };

    return this.prisma.conversation.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: {
              where: { isPrimary: true, deletedAt: null },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(data: {
    buyerId: string;
    sellerId: string;
    listingId?: string;
  }) {
    return this.prisma.conversation.create({
      data,
      include: {
        buyer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: {
              where: { isPrimary: true, deletedAt: null },
              take: 1,
            },
          },
        },
        messages: true,
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async update(id: string, data: { lastMessageAt?: Date }) {
    return this.prisma.conversation.update({
      where: { id },
      data,
    });
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        conversation: {
          OR: [
            { buyerId: userId },
            { sellerId: userId },
          ],
        },
        senderId: { not: userId },
        readAt: null,
      },
    });
  }
}

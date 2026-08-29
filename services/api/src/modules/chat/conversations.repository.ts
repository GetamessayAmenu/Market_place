import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateConversationParams {
  buyerId: string;
  sellerId: string;
  listingId?: string;
  orderId?: string;
  rentalId?: string;
  customOrderId?: string;
}

@Injectable()
export class ConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get conversationInclude() {
    return {
      buyer: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          phone: true,
        },
      },
      seller: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          phone: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          currency: true,
          status: true,
          images: {
            where: { isPrimary: true, deletedAt: null },
            take: 1,
            select: { url: true, cloudinaryPublicId: true },
          },
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          agreedPrice: true,
          type: true,
        },
      },
      rental: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          startDate: true,
          endDate: true,
          dailyRate: true,
          totalAmount: true,
        },
      },
      customOrderRef: {
        select: {
          id: true,
          status: true,
          agreedPrice: true,
          selectedColor: true,
          selectedFabric: true,
          selectedSize: true,
        },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' as Prisma.SortOrder },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { messages: true },
      },
    };
  }

  async findById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: this.conversationInclude,
    });
  }

  async findByParticipants(
    buyerId: string,
    sellerId: string,
    context?: { listingId?: string; orderId?: string; rentalId?: string; customOrderId?: string }
  ) {
    const where: Prisma.ConversationWhereInput = {
      buyerId,
      sellerId,
      deletedAt: null,
    };

    if (context?.listingId) where.listingId = context.listingId;
    if (context?.orderId) where.orderId = context.orderId;
    if (context?.rentalId) where.rentalId = context.rentalId;
    if (context?.customOrderId) where.customOrderId = context.customOrderId;

    return this.prisma.conversation.findFirst({
      where,
      include: this.conversationInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findUserConversations(userId: string, role: 'buyer' | 'seller') {
    const roleWhere = role === 'buyer'
      ? { buyerId: userId, archivedByBuyer: false }
      : { sellerId: userId, archivedBySeller: false };

    return this.prisma.conversation.findMany({
      where: {
        ...roleWhere,
        deletedAt: null,
      },
      include: this.conversationInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async userExists(id: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
      return !!user;
    } catch {
      return false;
    }
  }

  async listingExists(id: string): Promise<boolean> {
    try {
      const listing = await this.prisma.listing.findUnique({ where: { id }, select: { id: true } });
      return !!listing;
    } catch {
      return false;
    }
  }

  async create(data: CreateConversationParams) {
    try {
      return await this.prisma.conversation.create({
        data: {
          buyerId: data.buyerId,
          sellerId: data.sellerId,
          ...(data.listingId && { listingId: data.listingId }),
          ...(data.orderId && { orderId: data.orderId }),
          ...(data.rentalId && { rentalId: data.rentalId }),
          ...(data.customOrderId && { customOrderId: data.customOrderId }),
        },
        include: this.conversationInclude,
      });
    } catch (err: any) {
      if (err?.code === 'P2003') {
        // Fallback: create base conversation if context FK failed
        return this.prisma.conversation.create({
          data: {
            buyerId: data.buyerId,
            sellerId: data.sellerId,
          },
          include: this.conversationInclude,
        });
      }
      throw err;
    }
  }

  async update(id: string, data: { lastMessageAt?: Date; deletedAt?: Date; archivedByBuyer?: boolean; archivedBySeller?: boolean; isFlagged?: boolean; riskScore?: number }) {
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
        deliveryStatus: 'READ',
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
        deletedAt: null,
      },
    });
  }

  // ─── Block & Safety Helpers ───────────────────────────────────────────────

  async isUserBlocked(blockerId: string, targetUserId: string): Promise<boolean> {
    try {
      const block = await this.prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId, blockedUserId: targetUserId },
            { blockerId: targetUserId, blockedUserId: blockerId },
          ],
        },
      });
      return !!block;
    } catch {
      return false;
    }
  }

  async blockUser(blockerId: string, blockedUserId: string, reason?: string) {
    return this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedUserId: { blockerId, blockedUserId },
      },
      create: { blockerId, blockedUserId, reason: reason ?? null },
      update: { reason: reason ?? null },
    });
  }

  async unblockUser(blockerId: string, blockedUserId: string) {
    return this.prisma.userBlock.deleteMany({
      where: { blockerId, blockedUserId },
    });
  }

  async getBlockedUsers(blockerId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId },
      include: {
        blockedUser: {
          select: { id: true, displayName: true, avatarUrl: true, email: true },
        },
      },
    });
  }

  async createReport(params: {
    reporterId: string;
    targetType: 'message' | 'user' | 'conversation' | 'listing';
    reportedUserId?: string;
    listingId?: string;
    messageId?: string;
    conversationId?: string;
    reason: string;
    description?: string;
  }) {
    return this.prisma.report.create({
      data: {
        reporterId: params.reporterId,
        targetType: params.targetType,
        reportedUserId: params.reportedUserId ?? null,
        listingId: params.listingId ?? null,
        messageId: params.messageId ?? null,
        conversationId: params.conversationId ?? null,
        reason: params.reason,
        description: params.description ?? null,
      },
    });
  }
}

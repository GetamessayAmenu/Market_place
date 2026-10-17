import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class SellerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepository: UsersRepository,
  ) {}

  // ─── Hub 1: Overview ───────────────────────────────────────────────────────

  async getDashboardKpis(sellerId: string) {
    const [viewsAgg, viewsEvents, activeListings, distinctConversations, chatStartsEvents, waClicks, phoneClicks, pendingActions] =
      await Promise.all([
        this.prisma.listing.aggregate({
          where: { sellerId, deletedAt: null },
          _sum: { viewCount: true },
        }),
        this.prisma.analyticsEvent.count({
          where: { sellerId, eventType: 'listing_viewed' },
        }),
        this.prisma.listing.count({
          where: { sellerId, status: 'active', deletedAt: null },
        }),
        this.prisma.conversation.count({
          where: { sellerId, deletedAt: null },
        }),
        this.prisma.analyticsEvent.count({
          where: { sellerId, eventType: 'chat_started' },
        }),
        this.prisma.analyticsEvent.count({
          where: { sellerId, eventType: 'whatsapp_clicked' },
        }),
        this.prisma.analyticsEvent.count({
          where: { sellerId, eventType: 'phone_clicked' },
        }),
        this.getPendingActions(sellerId),
      ]);

    const listingViews = Math.max(viewsAgg._sum.viewCount || 0, viewsEvents);
    const chatStarts = Math.max(chatStartsEvents, distinctConversations);

    return {
      listingViews,
      chatStarts,
      whatsappClicks: waClicks,
      phoneReveals: phoneClicks,
      activeListings,
      pendingActions: pendingActions.length,
    };
  }

  async getPendingActions(sellerId: string) {
    const actions: Array<{
      id: string;
      type: 'approval' | 'rejection' | 'changes_requested' | 'rental_request' | 'handover' | 'custom_order' | 'unread_message' | 'profile_completion';
      title: string;
      description: string;
      urgency: 'high' | 'medium' | 'low';
      relatedId?: string;
      href?: string;
      createdAt: string;
    }> = [];

    // 1. Rejected listings (high urgency)
    const rejectedListings = await this.prisma.listing.findMany({
      where: { sellerId, status: 'rejected', deletedAt: null },
      select: { id: true, title: true, rejectedReason: true, updatedAt: true },
      take: 5,
    });
    for (const l of rejectedListings) {
      actions.push({
        id: `rejected-${l.id}`,
        type: 'rejection',
        urgency: 'high',
        title: 'Listing Rejected',
        description: l.rejectedReason
          ? `"${l.title}": ${l.rejectedReason}`
          : `"${l.title}" was rejected. Review feedback and resubmit.`,
        relatedId: l.id,
        href: `/seller/catalog/${l.id}/edit`,
        createdAt: l.updatedAt.toISOString(),
      });
    }

    // 2. Changes requested listings (high urgency)
    const changesListings = await this.prisma.listing.findMany({
      where: { sellerId, status: 'changes_requested', deletedAt: null },
      select: { id: true, title: true, rejectedReason: true, updatedAt: true },
      take: 5,
    });
    for (const l of changesListings) {
      actions.push({
        id: `changes-${l.id}`,
        type: 'changes_requested',
        urgency: 'high',
        title: 'Changes Requested',
        description: l.rejectedReason || `Moderators requested changes for "${l.title}". Click to edit.`,
        relatedId: l.id,
        href: `/seller/catalog/${l.id}/edit`,
        createdAt: l.updatedAt.toISOString(),
      });
    }

    // 3. New Rental requests received (high urgency)
    const rentalRequests = await this.prisma.rentalOrder.findMany({
      where: { sellerId, status: 'REQUESTED' },
      include: {
        listing: { select: { title: true } },
        renter: { select: { displayName: true } },
      },
      take: 5,
    });
    for (const r of rentalRequests) {
      const start = r.startDate ? new Date(r.startDate).toLocaleDateString() : '';
      const end = r.endDate ? new Date(r.endDate).toLocaleDateString() : '';
      actions.push({
        id: `rental-${r.id}`,
        type: 'rental_request',
        urgency: 'high',
        title: 'Rental Request Received',
        description: `${r.renter?.displayName || 'Customer'} requested to rent "${r.listing?.title}" (${start} - ${end}).`,
        relatedId: r.id,
        href: `/seller/orders`,
        createdAt: r.createdAt.toISOString(),
      });
    }

    // 4. Custom order requests (high urgency)
    const customRequests = await this.prisma.customOrder.findMany({
      where: { sellerId, status: 'submitted' },
      include: {
        listing: { select: { title: true } },
        buyer: { select: { displayName: true } },
      },
      take: 5,
    });
    for (const co of customRequests) {
      actions.push({
        id: `custom-${co.id}`,
        type: 'custom_order',
        urgency: 'high',
        title: 'New Custom Order Request',
        description: `${co.buyer?.displayName || 'Customer'} submitted custom tailoring instructions for "${co.listing?.title}".`,
        relatedId: co.id,
        href: `/seller/orders`,
        createdAt: co.createdAt.toISOString(),
      });
    }

    // 5. Listings awaiting approval (medium urgency)
    const pendingListings = await this.prisma.listing.findMany({
      where: { sellerId, status: 'pending_review', deletedAt: null },
      select: { id: true, title: true, createdAt: true },
      take: 5,
    });
    for (const l of pendingListings) {
      actions.push({
        id: `pending-${l.id}`,
        type: 'approval',
        urgency: 'medium',
        title: 'Listing Pending Review',
        description: `"${l.title}" is currently under review by platform moderators.`,
        relatedId: l.id,
        href: `/seller/listings`,
        createdAt: l.createdAt.toISOString(),
      });
    }

    // 6. Rental returns awaiting inspection (medium urgency)
    const returnInspections = await this.prisma.rentalOrder.findMany({
      where: { sellerId, status: 'RETURN_INITIATED' },
      include: { listing: { select: { title: true } } },
      take: 5,
    });
    for (const r of returnInspections) {
      actions.push({
        id: `return-${r.id}`,
        type: 'handover',
        urgency: 'medium',
        title: 'Rental Return Pending Inspection',
        description: `Item returned for rental #${r.orderNumber}. Please inspect condition to close order.`,
        relatedId: r.id,
        href: `/seller/orders`,
        createdAt: r.updatedAt.toISOString(),
      });
    }

    // 7. Unread messages (medium urgency)
    const unreadConversations = await this.prisma.conversation.findMany({
      where: {
        sellerId,
        deletedAt: null,
        messages: {
          some: {
            senderId: { not: sellerId },
            readAt: null,
            deletedAt: null,
          },
        },
      },
      include: {
        buyer: { select: { displayName: true } },
        listing: { select: { title: true } },
        messages: {
          where: { senderId: { not: sellerId }, readAt: null, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: 5,
    });
    for (const conv of unreadConversations) {
      const latestMsg = conv.messages[0];
      actions.push({
        id: `msg-${conv.id}`,
        type: 'unread_message',
        urgency: 'medium',
        title: `Unread Message from ${conv.buyer?.displayName || 'Buyer'}`,
        description: latestMsg?.content?.slice(0, 90) || `Inquiry on "${conv.listing?.title || 'listing'}"`,
        relatedId: conv.id,
        href: `/seller/messages`,
        createdAt: latestMsg?.createdAt?.toISOString() || conv.updatedAt.toISOString(),
      });
    }

    // 8. Seller Profile completion (low urgency)
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { phone: true, location: true, bio: true },
    });
    if (seller && (!seller.phone || !seller.location || !seller.bio)) {
      actions.push({
        id: `profile-${sellerId}`,
        type: 'profile_completion',
        urgency: 'low',
        title: 'Complete Store Profile',
        description: 'Add your shop sub-city, contact phone, and description to attract more buyers.',
        href: `/seller/store`,
        createdAt: new Date().toISOString(),
      });
    }

    const urgencyRank: Record<'high' | 'medium' | 'low', number> = { high: 1, medium: 2, low: 3 };
    return actions.sort((a, b) => (urgencyRank[a.urgency] ?? 3) - (urgencyRank[b.urgency] ?? 3));
  }

  async getEngagementMetrics(sellerId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      viewsAgg,
      viewsCurr,
      viewsPrev,
      chatsCurr,
      chatsPrev,
      totalChats,
      waCurr,
      waPrev,
      phoneCurr,
      phonePrev,
    ] = await Promise.all([
      this.prisma.listing.aggregate({
        where: { sellerId, deletedAt: null },
        _sum: { viewCount: true },
      }),
      this.prisma.analyticsEvent.count({
        where: { sellerId, eventType: 'listing_viewed', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.analyticsEvent.count({
        where: { sellerId, eventType: 'listing_viewed', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      this.prisma.analyticsEvent.count({
        where: { sellerId, eventType: 'chat_started', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.analyticsEvent.count({
        where: { sellerId, eventType: 'chat_started', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      this.prisma.conversation.count({
        where: { sellerId, deletedAt: null },
      }),
      this.prisma.analyticsEvent.count({
        where: { sellerId, eventType: 'whatsapp_clicked', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.analyticsEvent.count({
        where: { sellerId, eventType: 'whatsapp_clicked', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      this.prisma.analyticsEvent.count({
        where: { sellerId, eventType: 'phone_clicked', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.analyticsEvent.count({
        where: { sellerId, eventType: 'phone_clicked', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    const totalListingViews = Math.max(viewsAgg._sum.viewCount || 0, viewsCurr);
    const viewsChange = viewsPrev > 0 ? Math.round(((viewsCurr - viewsPrev) / viewsPrev) * 100) : 0;

    const chatStarts = Math.max(chatsCurr, totalChats);
    const chatsChange = chatsPrev > 0 ? Math.round(((chatsCurr - chatsPrev) / chatsPrev) * 100) : 0;

    const waChange = waPrev > 0 ? Math.round(((waCurr - waPrev) / waPrev) * 100) : 0;
    const phoneChange = phonePrev > 0 ? Math.round(((phoneCurr - phonePrev) / phonePrev) * 100) : 0;

    return [
      { label: 'Listing Views', value: totalListingViews, change: viewsChange },
      { label: 'Chat Starts', value: chatStarts, change: chatsChange },
      { label: 'WhatsApp Clicks', value: waCurr, change: waChange },
      { label: 'Phone Reveals', value: phoneCurr, change: phoneChange },
    ];
  }

  async getPromotionalBanner(_sellerId: string) {
    const now = new Date();
    const activeBanner = await this.prisma.heroBanner.findFirst({
      where: {
        status: 'published',
        deletedAt: null,
        AND: [
          { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
          { OR: [{ unpublishAt: null }, { unpublishAt: { gte: now } }] },
          { OR: [{ themeStartDate: null }, { themeStartDate: { lte: now } }] },
          { OR: [{ themeEndDate: null }, { themeEndDate: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (activeBanner) {
      return {
        id: activeBanner.id,
        title: activeBanner.title,
        subtitle: activeBanner.subtitle,
        linkUrl: activeBanner.linkUrl || '/seller/catalog',
        holidayTheme: activeBanner.holidayTheme,
      };
    }
    return null;
  }

  // ─── Hub 2: Catalog & Stock Manager ────────────────────────────────────────

  async getMyListings(
    sellerId: string,
    filters: { status?: string; search?: string; businessModel?: string },
  ) {
    const where: Prisma.ListingWhereInput = {
      sellerId,
      deletedAt: null,
    };

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status as any;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.businessModel) {
      if (filters.businessModel === 'sale' || filters.businessModel === 'ready-made') {
        where.availableForPurchase = true;
      } else if (filters.businessModel === 'rental') {
        where.availableForRent = true;
      } else if (filters.businessModel === 'custom') {
        where.customOrderAvailable = true;
      }
    }

    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((l) => {
      const businessModels: Array<'sale' | 'rental' | 'custom'> = [];
      if (l.availableForPurchase) businessModels.push('sale');
      if (l.availableForRent) businessModels.push('rental');
      if (l.customOrderAvailable) businessModels.push('custom');
      if (businessModels.length === 0) businessModels.push('sale');

      return {
        id: l.id,
        title: l.title,
        slug: l.slug,
        description: l.description,
        price: Number(l.price),
        currency: l.currency,
        condition: l.condition,
        status: l.status,
        city: l.city,
        viewCount: l.viewCount,
        rejectedReason: l.rejectedReason,
        createdAt: l.createdAt.toISOString(),
        primaryImageUrl: l.images[0]?.url,
        images: l.images.map((img) => ({ id: img.id, url: img.url, isPrimary: img.isPrimary })),
        businessModels,
        availableForPurchase: l.availableForPurchase,
        availableForRent: l.availableForRent,
        customOrderAvailable: l.customOrderAvailable,
        rentalPricePerDay: l.rentalPricePerDay ? Number(l.rentalPricePerDay) : null,
        rentalDeposit: l.rentalDeposit ? Number(l.rentalDeposit) : null,
        category: l.category,
      };
    });
  }

  async updateListingStatus(sellerId: string, listingId: string, status: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, status: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You do not have permission to update this listing');
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: status as any },
    });

    return { success: true, listing: updated };
  }

  async getBlackoutDates(sellerId: string) {
    const records = await this.prisma.rentalBlackoutDate.findMany({
      where: {
        OR: [{ createdByUserId: sellerId }, { listing: { sellerId } }],
      },
      include: {
        listing: { select: { id: true, title: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return records.map((r) => ({
      id: r.id,
      startDate: r.startDate.toISOString().slice(0, 10),
      endDate: r.endDate.toISOString().slice(0, 10),
      reason: r.reason || '',
      listingId: r.listingId,
      listingTitle: r.listing?.title,
    }));
  }

  async addBlackoutDate(
    sellerId: string,
    data: { startDate: string; endDate: string; reason: string; listingId?: string },
  ) {
    let listingId = data.listingId;
    if (!listingId) {
      const rentalListing =
        (await this.prisma.listing.findFirst({
          where: { sellerId, availableForRent: true, deletedAt: null },
          select: { id: true },
        })) ||
        (await this.prisma.listing.findFirst({
          where: { sellerId, deletedAt: null },
          select: { id: true },
        }));

      if (!rentalListing) {
        throw new BadRequestException(
          'Please create a rental listing before adding blackout calendar dates.',
        );
      }
      listingId = rentalListing.id;
    } else {
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        select: { sellerId: true },
      });
      if (!listing || listing.sellerId !== sellerId) {
        throw new ForbiddenException('You do not own this listing.');
      }
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (start >= end) {
      throw new BadRequestException('End date must be strictly after start date.');
    }

    const created = await this.prisma.rentalBlackoutDate.create({
      data: {
        listingId,
        createdByUserId: sellerId,
        startDate: start,
        endDate: end,
        reason: data.reason,
      },
      include: {
        listing: { select: { title: true } },
      },
    });

    return {
      id: created.id,
      startDate: created.startDate.toISOString().slice(0, 10),
      endDate: created.endDate.toISOString().slice(0, 10),
      reason: created.reason || '',
      listingId: created.listingId,
      listingTitle: created.listing?.title,
    };
  }

  async updateBlackoutDate(
    sellerId: string,
    id: string,
    data: { startDate?: string; endDate?: string; reason?: string },
  ) {
    const existing = await this.prisma.rentalBlackoutDate.findUnique({
      where: { id },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!existing) throw new NotFoundException('Blackout date not found');
    if (existing.createdByUserId !== sellerId && existing.listing?.sellerId !== sellerId) {
      throw new ForbiddenException('Unauthorized to modify this blackout date');
    }

    const updated = await this.prisma.rentalBlackoutDate.update({
      where: { id },
      data: {
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
        ...(data.reason !== undefined ? { reason: data.reason } : {}),
      },
    });

    return {
      id: updated.id,
      startDate: updated.startDate.toISOString().slice(0, 10),
      endDate: updated.endDate.toISOString().slice(0, 10),
      reason: updated.reason || '',
    };
  }

  async deleteBlackoutDate(sellerId: string, id: string) {
    const record = await this.prisma.rentalBlackoutDate.findUnique({
      where: { id },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!record) {
      throw new NotFoundException('Blackout date not found.');
    }
    if (record.createdByUserId !== sellerId && record.listing?.sellerId !== sellerId) {
      throw new ForbiddenException('You are not authorized to delete this blackout date.');
    }
    await this.prisma.rentalBlackoutDate.delete({ where: { id } });
    return { success: true };
  }

  // ─── Hub 3: Orders & Requests Pipeline ─────────────────────────────────────

  async getMyOrders(sellerId: string, filters: { model?: string; status?: string }) {
    const [salesOrders, rentalOrders, customOrders] = await Promise.all([
      // Sales orders
      filters.model && filters.model !== 'SALE' && filters.model !== 'sale'
        ? []
        : this.prisma.order.findMany({
            where: {
              sellerId,
              ...(filters.status && filters.status !== 'all' ? { status: filters.status as any } : {}),
            },
            include: {
              buyer: { select: { id: true, displayName: true, email: true, phone: true, avatarUrl: true, location: true } },
              product: { select: { id: true, title: true, slug: true, price: true, currency: true, images: { take: 1 } } },
            },
            orderBy: { createdAt: 'desc' },
          }),

      // Rental orders
      filters.model && filters.model !== 'RENTAL' && filters.model !== 'rental'
        ? []
        : this.prisma.rentalOrder.findMany({
            where: {
              sellerId,
              ...(filters.status && filters.status !== 'all' ? { status: filters.status as any } : {}),
            },
            include: {
              renter: { select: { id: true, displayName: true, email: true, phone: true, avatarUrl: true, location: true } },
              listing: { select: { id: true, title: true, slug: true, price: true, currency: true, images: { take: 1 } } },
            },
            orderBy: { createdAt: 'desc' },
          }),

      // Custom orders
      filters.model && filters.model !== 'CUSTOM_TAILORING' && filters.model !== 'custom'
        ? []
        : this.prisma.customOrder.findMany({
            where: {
              sellerId,
              ...(filters.status && filters.status !== 'all' ? { status: filters.status as any } : {}),
            },
            include: {
              buyer: { select: { id: true, displayName: true, email: true, phone: true, avatarUrl: true, location: true } },
              listing: { select: { id: true, title: true, slug: true, price: true, currency: true, images: { take: 1 } } },
            },
            orderBy: { createdAt: 'desc' },
          }),
    ]);

    const unified: any[] = [];

    for (const o of salesOrders) {
      unified.push({
        id: o.id,
        orderNumber: o.orderNumber,
        type: o.type || 'SALE',
        status: o.status,
        buyerId: o.buyerId,
        sellerId: o.sellerId,
        productId: o.productId,
        conversationId: o.conversationId,
        agreedPrice: Number(o.agreedPrice),
        agreedDeposit: o.agreed_deposit ? Number(o.agreed_deposit) : null,
        offlineDepositRefunded: o.offline_deposit_refunded || false,
        customMeasurements: o.customMeasurements,
        fittingDate: o.fitting_date?.toISOString() || null,
        rentalStartDate: o.rentalStartDate?.toISOString() || null,
        rentalEndDate: o.rentalEndDate?.toISOString() || null,
        createdAt: o.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: o.updatedAt?.toISOString() || new Date().toISOString(),
        buyer: o.buyer,
        product: {
          ...o.product,
          price: Number(o.product.price),
        },
      });
    }

    for (const r of rentalOrders) {
      unified.push({
        id: r.id,
        orderNumber: r.orderNumber,
        type: 'RENTAL',
        status: r.status,
        buyerId: r.renterId,
        sellerId: r.sellerId,
        productId: r.listingId,
        agreedPrice: Number(r.totalAmount),
        agreedDeposit: Number(r.securityDeposit),
        offlineDepositRefunded: r.depositRefunded,
        rentalStartDate: r.startDate.toISOString(),
        rentalEndDate: r.endDate.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        buyer: r.renter,
        product: {
          ...r.listing,
          price: Number(r.listing.price),
        },
      });
    }

    for (const c of customOrders) {
      unified.push({
        id: c.id,
        orderNumber: `CST-${c.id.slice(0, 8).toUpperCase()}`,
        type: 'CUSTOM_TAILORING',
        status: c.status,
        buyerId: c.buyerId,
        sellerId: c.sellerId,
        productId: c.listingId,
        conversationId: c.conversationId,
        agreedPrice: c.agreedPrice ? Number(c.agreedPrice) : Number(c.listing.price),
        customMeasurements: c.measurements,
        buyerNotes: c.buyerNotes,
        selectedColor: c.selectedColor,
        selectedFabric: c.selectedFabric,
        selectedSize: c.selectedSize,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        buyer: c.buyer,
        product: {
          ...c.listing,
          price: Number(c.listing.price),
        },
      });
    }

    return unified.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getOrderDetail(sellerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, sellerId },
      include: {
        buyer: { select: { id: true, displayName: true, email: true, phone: true, avatarUrl: true, location: true } },
        product: { select: { id: true, title: true, slug: true, price: true, currency: true, images: true } },
      },
    });
    if (order) return order;

    const rental = await this.prisma.rentalOrder.findFirst({
      where: { id: orderId, sellerId },
      include: {
        renter: { select: { id: true, displayName: true, email: true, phone: true, avatarUrl: true, location: true } },
        listing: { select: { id: true, title: true, slug: true, price: true, currency: true, images: true } },
      },
    });
    if (rental) return rental;

    const custom = await this.prisma.customOrder.findFirst({
      where: { id: orderId, sellerId },
      include: {
        buyer: { select: { id: true, displayName: true, email: true, phone: true, avatarUrl: true, location: true } },
        listing: { select: { id: true, title: true, slug: true, price: true, currency: true, images: true } },
      },
    });
    if (custom) return custom;

    throw new NotFoundException('Order not found');
  }

  async updateOrderStatus(sellerId: string, orderId: string, status: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, sellerId } });
    if (order) {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: status as any } });
      return { success: true };
    }

    const rental = await this.prisma.rentalOrder.findFirst({ where: { id: orderId, sellerId } });
    if (rental) {
      await this.prisma.rentalOrder.update({ where: { id: orderId }, data: { status: status as any } });
      return { success: true };
    }

    const custom = await this.prisma.customOrder.findFirst({ where: { id: orderId, sellerId } });
    if (custom) {
      await this.prisma.customOrder.update({ where: { id: orderId }, data: { status: status as any } });
      return { success: true };
    }

    throw new NotFoundException('Order not found');
  }

  async updateCustomMilestone(sellerId: string, orderId: string, milestone: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, sellerId } });
    if (order) {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: milestone as any } });
      return { success: true };
    }

    const custom = await this.prisma.customOrder.findFirst({ where: { id: orderId, sellerId } });
    if (custom) {
      await this.prisma.customOrder.update({ where: { id: orderId }, data: { status: milestone as any } });
      return { success: true };
    }

    throw new NotFoundException('Custom order not found');
  }

  // ─── Hub 4: Direct Communication Center ────────────────────────────────────

  async getConversations(sellerId: string, filter?: 'all' | 'unread' | 'with_order') {
    const where: Prisma.ConversationWhereInput = {
      sellerId,
      deletedAt: null,
      archivedBySeller: false,
    };

    if (filter === 'unread') {
      where.messages = {
        some: {
          senderId: { not: sellerId },
          readAt: null,
          deletedAt: null,
        },
      };
    } else if (filter === 'with_order') {
      where.OR = [
        { orderId: { not: null } },
        { rentalId: { not: null } },
        { customOrderId: { not: null } },
      ];
    }

    const convs = await this.prisma.conversation.findMany({
      where,
      include: {
        buyer: { select: { id: true, displayName: true, avatarUrl: true, phone: true } },
        listing: { select: { id: true, title: true, price: true, currency: true, images: { take: 1 } } },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return Promise.all(
      convs.map(async (c) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: sellerId },
            readAt: null,
            deletedAt: null,
          },
        });

        const lastMessage = c.messages[0];

        return {
          id: c.id,
          buyerId: c.buyerId,
          sellerId: c.sellerId,
          listingId: c.listingId,
          orderId: c.orderId || c.rentalId || c.customOrderId,
          lastMessage: lastMessage ? lastMessage.content : '',
          lastMessageAt: c.lastMessageAt?.toISOString() || c.updatedAt.toISOString(),
          unreadCount,
          buyer: c.buyer,
          listing: c.listing
            ? {
                ...c.listing,
                price: Number(c.listing.price),
                primaryImageUrl: c.listing.images[0]?.url,
              }
            : null,
        };
      }),
    );
  }

  async getConversationMessages(sellerId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { sellerId: true, buyerId: true },
    });
    if (!conv || (conv.sellerId !== sellerId && conv.buyerId !== sellerId)) {
      throw new ForbiddenException('Access denied to conversation messages');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() || null,
      sender: m.sender,
    }));
  }

  async sendMessage(sellerId: string, conversationId: string, content: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { sellerId: true, buyerId: true },
    });
    if (!conv || (conv.sellerId !== sellerId && conv.buyerId !== sellerId)) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: sellerId,
        content,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return { success: true, message };
  }

  async markConversationRead(sellerId: string, conversationId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: sellerId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  // ─── Hub 5: Store & Profile Manager ───────────────────────────────────────

  async getProfile(sellerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        vendorKycProfile: true,
        verificationRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!user) throw new NotFoundException('Seller profile not found');

    const socialLinks = (user.socialLinks as any) || {};

    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      sellerType: user.sellerType,
      avatarUrl: user.avatarUrl,
      coverImageUrl: user.coverImageUrl,
      specialties: user.specialties,
      socialLinks: user.socialLinks,
      promotions: socialLinks.promotions || { pinnedListings: [], bannerText: '' },
      isVerifiedDesigner: user.isVerifiedDesigner,
      verifiedDesignerAt: user.verifiedDesignerAt,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(
    sellerId: string,
    data: {
      displayName?: string;
      phone?: string;
      bio?: string;
      location?: any;
      sellerType?: any;
    },
  ) {
    const updateData: Prisma.UserUpdateInput = {};
    if (data.displayName) updateData.displayName = data.displayName;
    if (data.phone) updateData.phone = data.phone;
    if (data.bio) updateData.bio = data.bio;
    if (data.sellerType) updateData.sellerType = data.sellerType;

    if (data.location) {
      if (typeof data.location === 'string') {
        updateData.location = data.location;
      } else {
        const parts = [
          data.location.address,
          data.location.subCity,
          data.location.regionalHub,
        ].filter(Boolean);
        updateData.location = parts.join(', ');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: sellerId },
      data: updateData,
    });

    return { success: true, user: updated };
  }

  async getVerificationStatus(sellerId: string) {
    const [kyc, req] = await Promise.all([
      this.prisma.vendorKycProfile.findUnique({ where: { userId: sellerId } }),
      this.prisma.verificationRequest.findFirst({
        where: { userId: sellerId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (kyc?.status === 'APPROVED' || req?.status === 'approved') {
      return {
        status: 'verified',
        documents: { tin: kyc?.tinNumber, businessLicense: kyc?.licenseUrl },
      };
    }
    if (kyc?.status === 'PENDING' || req?.status === 'pending') {
      return {
        status: 'pending',
        documents: { tin: kyc?.tinNumber, businessLicense: kyc?.licenseUrl },
      };
    }
    if (kyc?.status === 'REJECTED' || req?.status === 'rejected') {
      return {
        status: 'rejected',
        rejectionReason: kyc?.rejectionReason || req?.rejectionReason || 'Documents rejected.',
        documents: { tin: kyc?.tinNumber, businessLicense: kyc?.licenseUrl },
      };
    }
    return { status: 'not_submitted', documents: {} };
  }

  async submitVerificationDocuments(sellerId: string, data: any) {
    const tinNumber = data.tin || `TIN-${Date.now().toString().slice(-9)}`;
    const licenseUrl = data.businessLicense || 'pending_document';

    await this.prisma.vendorKycProfile.upsert({
      where: { userId: sellerId },
      create: {
        userId: sellerId,
        businessName: data.businessName || 'Authentic Habesha Store',
        tinNumber,
        licenseUrl,
        status: 'PENDING',
      },
      update: {
        tinNumber,
        licenseUrl,
        status: 'PENDING',
        rejectionReason: null,
      },
    });

    await this.prisma.verificationRequest.create({
      data: {
        userId: sellerId,
        type: 'business',
        status: 'pending',
        documentUrl: licenseUrl,
        metadata: { tin: tinNumber, artisanCertificate: data.artisanCertificate },
      },
    });

    return { success: true, message: 'Verification documents submitted for review.' };
  }

  async getPromotions(sellerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { socialLinks: true },
    });
    const socialLinks = (user?.socialLinks as any) || {};
    return socialLinks.promotions || { pinnedListings: [], bannerText: '' };
  }

  async updatePromotions(sellerId: string, data: { pinnedListings?: string[]; bannerText?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { socialLinks: true },
    });
    const current = (user?.socialLinks as any) || {};
    current.promotions = {
      pinnedListings: data.pinnedListings || [],
      bannerText: data.bannerText || '',
    };

    await this.prisma.user.update({
      where: { id: sellerId },
      data: { socialLinks: current },
    });

    return { success: true, promotions: current.promotions };
  }

  // ─── Store Follow Feature ───────────────────────────────────────────────────

  async getFollowers(sellerId: string) {
    const followers = await this.usersRepository.findStoreFollowsByStore(sellerId);

    return followers.map((follow: any) => ({
      id: follow.id,
      follower: follow.follower,
      followedAt: follow.createdAt,
    }));
  }

  // ─── Hub 6: Insights & Customer Feedback ───────────────────────────────────

  async getAnalytics(sellerId: string, period: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [viewsAgg, viewsEvents, chatStarts, waClicks, phoneReveals, ordersCount] =
      await Promise.all([
        this.prisma.listing.aggregate({
          where: { sellerId, deletedAt: null },
          _sum: { viewCount: true },
        }),
        this.prisma.analyticsEvent.count({
          where: { sellerId, eventType: 'listing_viewed', createdAt: { gte: since } },
        }),
        this.prisma.analyticsEvent.count({
          where: { sellerId, eventType: 'chat_started', createdAt: { gte: since } },
        }),
        this.prisma.analyticsEvent.count({
          where: { sellerId, eventType: 'whatsapp_clicked', createdAt: { gte: since } },
        }),
        this.prisma.analyticsEvent.count({
          where: { sellerId, eventType: 'phone_clicked', createdAt: { gte: since } },
        }),
        this.prisma.order.count({
          where: { sellerId, createdAt: { gte: since } },
        }),
      ]);

    const listingViews = Math.max(viewsAgg._sum.viewCount || 0, viewsEvents);
    const totalContacts = chatStarts + waClicks + phoneReveals;
    const conversionRate =
      listingViews > 0 ? Math.round((totalContacts / listingViews) * 1000) / 10 : 0;

    return {
      listingViews,
      chatStarts,
      whatsappClicks: waClicks,
      phoneReveals,
      ordersCount,
      conversionRate,
      period,
    };
  }

  async getDeposits(sellerId: string) {
    const rentalOrders = await this.prisma.rentalOrder.findMany({
      where: { sellerId, securityDeposit: { gt: 0 } },
      include: {
        renter: { select: { displayName: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rentalOrders.map((r) => ({
      id: r.id,
      type: r.depositRefunded ? ('refunded' as const) : ('held' as const),
      amount: r.securityDeposit,
      customerName: r.renter?.displayName || 'Customer',
      relatedOrder: r.orderNumber,
      date: r.createdAt.toISOString().slice(0, 10),
      notes: r.depositRefundReason || (r.depositRefunded ? 'Refunded' : 'Held for active rental'),
    }));
  }

  async addDeposit(
    sellerId: string,
    data: {
      type: 'held' | 'refunded';
      amount: number;
      customerName: string;
      relatedOrder: string;
      notes?: string;
    },
  ) {
    const rental = await this.prisma.rentalOrder.findFirst({
      where: { sellerId, orderNumber: data.relatedOrder },
    });
    if (rental) {
      await this.prisma.rentalOrder.update({
        where: { id: rental.id },
        data: {
          depositRefunded: data.type === 'refunded',
          depositRefundReason: data.notes || null,
        },
      });
      return { success: true };
    }

    const order = await this.prisma.order.findFirst({
      where: { sellerId, orderNumber: data.relatedOrder },
    });
    if (order) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          offline_deposit_refunded: data.type === 'refunded',
        },
      });
      return { success: true };
    }

    return { success: true, message: 'Deposit recorded' };
  }

  async getReviews(sellerId: string, filters: { rating?: number; listingId?: string }) {
    const where: Prisma.ReviewWhereInput = {
      sellerId,
      deletedAt: null,
    };
    if (filters.rating) where.rating = Number(filters.rating);
    if (filters.listingId) where.listingId = filters.listingId;

    const [reviews, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          reviewer: { select: { displayName: true, avatarUrl: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.aggregate({
        where: { sellerId, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0,
      totalReviews: aggregate._count.rating || 0,
      reviews: reviews.map((r) => ({
        id: r.id,
        customerName: r.reviewer?.displayName || 'Customer',
        rating: r.rating,
        comment: r.body || r.title || 'Verified review',
        date: r.createdAt.toISOString().slice(0, 10),
        listing: r.listing?.title,
      })),
    };
  }

  async respondToReview(sellerId: string, reviewId: string, response: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { sellerId: true },
    });
    if (!review || review.sellerId !== sellerId) {
      throw new ForbiddenException('Review does not belong to this seller');
    }

    // Preserve existing body and append seller response
    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        moderationReason: response,
      },
    });

    return { success: true };
  }

  async getCustomers(sellerId: string, search?: string) {
    const [orders, rentals, customOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId },
        include: { buyer: { select: { id: true, displayName: true, email: true, phone: true } } },
      }),
      this.prisma.rentalOrder.findMany({
        where: { sellerId },
        include: { renter: { select: { id: true, displayName: true, email: true, phone: true } } },
      }),
      this.prisma.customOrder.findMany({
        where: { sellerId },
        include: { buyer: { select: { id: true, displayName: true, email: true, phone: true } } },
      }),
    ]);

    const customerMap = new Map<
      string,
      {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        totalOrders: number;
        lastOrderDate: string;
        storedMeasurements?: Record<string, number>;
      }
    >();

    const processCust = (user: any, date: Date, measurements?: any) => {
      if (!user) return;
      const existing = customerMap.get(user.id);
      const dateStr = date.toISOString().slice(0, 10);
      if (existing) {
        existing.totalOrders += 1;
        if (dateStr > existing.lastOrderDate) existing.lastOrderDate = dateStr;
        if (measurements && !existing.storedMeasurements) {
          existing.storedMeasurements = measurements;
        }
      } else {
        customerMap.set(user.id, {
          id: user.id,
          name: user.displayName || 'Customer',
          email: user.email,
          phone: user.phone || undefined,
          totalOrders: 1,
          lastOrderDate: dateStr,
          storedMeasurements: measurements || undefined,
        });
      }
    };

    orders.forEach((o) => processCust(o.buyer, o.createdAt || new Date(), o.customMeasurements));
    rentals.forEach((r) => processCust(r.renter, r.createdAt));
    customOrders.forEach((c) => processCust(c.buyer, c.createdAt, c.measurements));

    let list = Array.from(customerMap.values());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q),
      );
    }

    return list.sort(
      (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime(),
    );
  }

  async getCustomerDetail(sellerId: string, customerId: string) {
    const list = await this.getCustomers(sellerId);
    const customer = list.find((c) => c.id === customerId);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateCustomerMeasurements(
    sellerId: string,
    customerId: string,
    measurements: Record<string, number>,
  ) {
    // Update measurements on recent custom order between this buyer and seller
    const custom = await this.prisma.customOrder.findFirst({
      where: { sellerId, buyerId: customerId },
      orderBy: { createdAt: 'desc' },
    });
    if (custom) {
      await this.prisma.customOrder.update({
        where: { id: custom.id },
        data: { measurements },
      });
    }
    return { success: true };
  }
}

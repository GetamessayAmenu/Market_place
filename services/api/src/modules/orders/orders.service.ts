import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { OrdersRepository } from './orders.repository';
import { OrderQueryDto } from './dto/order-query.dto';
import type { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from './dto/update-order-status.dto';
import { OrderType } from './dto/order-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderStateMachineService } from './order-state-machine.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RequestExtensionDto, RespondExtensionDto } from './dto/rental-extension.dto';
import { UpdateTailoringMilestoneDto, TailoringMilestone } from './dto/tailoring-milestone.dto';
import { DeclineOrderDto, DeclineReason } from './dto/decline-order.dto';
import { AlternativeDateSuggestionDto } from './dto/alternative-date.dto';

export interface SerializedOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly type: string;
  readonly status: string;
  readonly buyerId: string;
  readonly sellerId: string;
  readonly productId: string;
  readonly conversationId: string | null;
  readonly agreedPrice: number;
  readonly agreedDeposit: number | null;
  readonly offlineDepositRefunded: boolean;
  readonly customMeasurements: any;
  readonly fittingDate: string | null;
  readonly rentalStartDate: string | null;
  readonly rentalEndDate: string | null;
  readonly extensionDaysRequested: number;
  readonly extensionApproved: boolean | null;
  readonly preHandoverPhotos: string[];
  readonly postReturnPhotos: string[];
  readonly disputeNotes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly buyer: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    location: string | null;
  };
  readonly seller: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    location: string | null;
  };
  readonly product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    images: any[];
  };
  readonly conversation?: any;
  readonly customQuotes?: any[];
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly notificationsService: NotificationsService,
    private readonly stateMachine: OrderStateMachineService,
    private readonly uploadsService: UploadsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.type !== undefined ? { type: query.type } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.buyerId !== undefined ? { buyerId: query.buyerId } : {}),
      ...(query.sellerId !== undefined ? { sellerId: query.sellerId } : {}),
      ...(query.search !== undefined
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: 'insensitive' as const } },
              { buyer: { displayName: { contains: query.search, mode: 'insensitive' as const } } },
              { seller: { displayName: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const orderBy = { createdAt: 'desc' as const };

    const [items, total] = await Promise.all([
      this.ordersRepository.findAll({ where, orderBy, skip, take: limit }),
      this.ordersRepository.count(where),
    ]);

    return toPaginatedResponse({
      items: items.map((order: any) => this.serializeOrder(order)),
      total,
      page,
      limit,
    });
  }

  async findOne(id: string): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    return this.serializeOrder(order);
  }

  async findByOrderNumber(orderNumber: string): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new Error('Order not found');
    }
    return this.serializeOrder(order);
  }

  async create(user: AuthenticatedUser, dto: CreateOrderDto): Promise<SerializedOrder> {
    // Generate unique order number
    const orderNumber = this.generateOrderNumber();

    // Get product (listing) details
    const product = await (this.ordersRepository as any).prisma.listing.findUnique({
      where: { id: dto.productId },
      select: {
        id: true,
        sellerId: true,
        title: true,
        price: true,
        currency: true,
        status: true,
        availableForPurchase: true,
        availableForRent: true,
        customOrderAvailable: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'active') {
      throw new ForbiddenException('Product is not available');
    }

    if (product.sellerId === user.id) {
      throw new ForbiddenException('Cannot create order for your own product');
    }

    // Validate order type against product capabilities
    if (dto.type === OrderType.SALE && !product.availableForPurchase) {
      throw new ForbiddenException('Product is not available for sale');
    }

    if (dto.type === OrderType.RENTAL && !product.availableForRent) {
      throw new ForbiddenException('Product is not available for rental');
    }

    if (dto.type === OrderType.CUSTOM_TAILORING && !product.customOrderAvailable) {
      throw new ForbiddenException('Product is not available for custom tailoring');
    }

    // Create conversation for this order
    const conversation = await (this.ordersRepository as any).prisma.conversation.create({
      data: {
        listingId: product.id,
        buyerId: user.id,
        sellerId: product.sellerId,
      },
    });

    // Create the order
    const order = await this.ordersRepository.create({
      orderNumber,
      type: dto.type,
      status: 'INQUIRY_PENDING',
      buyerId: user.id,
      sellerId: product.sellerId,
      productId: product.id,
      conversationId: conversation.id,
      agreedPrice: dto.agreedPrice || product.price,
      agreedDeposit: dto.agreedDeposit,
      offlineDepositRefunded: false,
      extensionDaysRequested: 0,
      preHandoverPhotos: [],
      postReturnPhotos: [],
      ...(dto.shippingAddress && {
        shipping_address: dto.shippingAddress,
      }),
      ...(dto.type === OrderType.RENTAL && {
        rentalStartDate: dto.rentalStartDate,
        rentalEndDate: dto.rentalEndDate,
      }),
      ...(dto.type === OrderType.CUSTOM_TAILORING && {
        customMeasurements: dto.customMeasurements,
        fittingDate: dto.fittingDate,
      }),
    });

    // Fetch the complete order with relations
    const createdOrder = await this.ordersRepository.findById(order.id);
    
    // Notify seller about new order
    await this.notificationsService.createNewOrderNotification(
      product.sellerId,
      order.id,
      orderNumber,
      product.title,
      user.email,
      Number(dto.agreedPrice || product.price),
      product.currency,
    );
    
    return this.serializeOrder(createdOrder);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private serializeOrder(order: any): SerializedOrder {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      productId: order.productId,
      conversationId: order.conversationId ?? null,
      agreedPrice: Number(order.agreedPrice),
      agreedDeposit: order.agreedDeposit ? Number(order.agreedDeposit) : null,
      offlineDepositRefunded: order.offlineDepositRefunded,
      customMeasurements: order.customMeasurements,
      fittingDate: order.fittingDate?.toISOString() ?? null,
      rentalStartDate: order.rentalStartDate?.toISOString() ?? null,
      rentalEndDate: order.rentalEndDate?.toISOString() ?? null,
      extensionDaysRequested: order.extensionDaysRequested || 0,
      extensionApproved: order.extensionApproved ?? null,
      preHandoverPhotos: order.preHandoverPhotos || [],
      postReturnPhotos: order.postReturnPhotos || [],
      disputeNotes: order.disputeNotes ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      buyer: order.buyer,
      seller: order.seller,
      product: {
        ...order.product,
        price: Number(order.product.price),
      },
      conversation: order.conversation,
      customQuotes: order.customQuotes,
    };
  }

  async updateOrderStatus(
    orderId: string,
    user: AuthenticatedUser,
    dto: UpdateOrderStatusDto
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify user is either buyer or seller
    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to update this order');
    }

    // Validate state transition
    this.stateMachine.validateTransition(order.type, order.status as OrderStatus, dto.status);

    // Update order
    const updatedOrder = await this.ordersRepository.update(orderId, {
      status: dto.status,
      ...(dto.preHandoverPhotos && { preHandoverPhotos: dto.preHandoverPhotos }),
      ...(dto.postReturnPhotos && { postReturnPhotos: dto.postReturnPhotos }),
      ...(dto.disputeNotes && { disputeNotes: dto.disputeNotes }),
    });

    // Log system message to conversation if exists
    if (order.conversationId) {
      try {
        // Fetch user details to get displayName
        const userDetails = await (this.ordersRepository as any).prisma.user.findUnique({
          where: { id: user.id },
          select: { displayName: true }
        });
        
        const statusMessage = this.formatStatusChangeMessage(dto.status, userDetails?.displayName || user.email);
        await (this.ordersRepository as any).prisma.message.create({
          data: {
            conversationId: order.conversationId,
            senderId: user.id,
            body: JSON.stringify({
              type: 'system',
              content: statusMessage,
              metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                previousStatus: order.status,
                newStatus: dto.status,
                updatedBy: userDetails?.displayName || user.email,
              }
            }),
            metadata: {
              type: 'system_status_update',
              orderId: order.id,
              previousStatus: order.status,
              newStatus: dto.status,
            }
          }
        });
      } catch (error) {
        // Log error but don't fail the status update
        console.error('Failed to log status change to conversation:', error);
      }
    }

    // Notify the other party
    const recipientId = order.buyerId === user.id ? order.sellerId : order.buyerId;
    await this.notificationsService.createCustomNotification(
      recipientId,
      'new_order',
      `Order ${order.orderNumber} status updated`,
      `Order status changed to ${dto.status}`,
      { orderId: order.id, orderNumber: order.orderNumber }
    );

    // Emit Socket.IO event for real-time updates
    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      previousStatus: order.status,
      newStatus: dto.status,
      updatedBy: user.id,
    });

    return this.serializeOrder(updatedOrder);
  }

  private formatStatusChangeMessage(status: OrderStatus, actorName: string): string {
    const statusLabels: Record<OrderStatus, string> = {
      INQUIRY_PENDING: 'Pending Inquiry',
      QUOTE_PROPOSED: 'Quote Proposed',
      APPROVED_RESERVED: 'Approved / Reserved',
      READY_FOR_HANDOVER: 'Ready for Handover',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      DISPUTED: 'Disputed',
      MEASUREMENTS_SUBMITTED: 'Measurements Submitted',
      FABRIC_CUTTING: 'Fabric Cutting',
      TAILORING_IN_PROGRESS: 'Tailoring in Progress',
      FITTING_READY: 'Ready for Fitting',
      HANDOVER_PENDING_DEPOSIT: 'Handover Pending',
      RENTAL_ACTIVE: 'Rental Active',
      RETURN_INITIATED: 'Return Initiated',
      RETURNED_INSPECTED: 'Returned & Inspected',
    };
    
    return `📋 Order status updated to "${statusLabels[status]}" by ${actorName}`;
  }

  async createQuote(
    orderId: string,
    user: AuthenticatedUser,
    dto: CreateQuoteDto
  ): Promise<any> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only seller can create quotes
    if (order.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can create quotes');
    }

    // Only allow quotes for inquiry pending status
    if (order.status !== OrderStatus.INQUIRY_PENDING) {
      throw new BadRequestException('Quotes can only be created for pending inquiries');
    }

    const quote = await (this.ordersRepository as any).prisma.customQuote.create({
      data: {
        orderId,
        offeredByUserId: user.id,
        proposedPrice: dto.proposedPrice,
        proposedDeposit: dto.proposedDeposit,
        notes: dto.notes,
        // Store additional quote metadata in notes or extend schema
        metadata: {
          estimatedLeadTimeDays: dto.estimatedLeadTimeDays,
          customizationNotes: dto.customizationNotes,
          fabricType: dto.fabricType,
          embroideryPattern: dto.embroideryPattern,
        },
      },
    });

    // Update order status to quote proposed
    await this.ordersRepository.update(orderId, {
      status: OrderStatus.QUOTE_PROPOSED,
    });

    // Notify buyer
    await this.notificationsService.createCustomNotification(
      order.buyerId,
      'new_order',
      `New quote for order ${order.orderNumber}`,
      `Seller has proposed a quote of ${dto.proposedPrice}${dto.estimatedLeadTimeDays ? ` with ${dto.estimatedLeadTimeDays} day lead time` : ''}`,
      { orderId: order.id, quoteId: quote.id }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('order.quote_proposed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      quoteId: quote.id,
      proposedPrice: dto.proposedPrice,
      proposedDeposit: dto.proposedDeposit,
      estimatedLeadTimeDays: dto.estimatedLeadTimeDays,
    });

    return quote;
  }

  async acceptQuote(
    orderId: string,
    quoteId: string,
    user: AuthenticatedUser
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only buyer can accept quotes
    if (order.buyerId !== user.id) {
      throw new ForbiddenException('Only buyers can accept quotes');
    }

    const quote = await (this.ordersRepository as any).prisma.customQuote.findUnique({
      where: { id: quoteId },
    });

    if (!quote || quote.orderId !== orderId) {
      throw new NotFoundException('Quote not found');
    }

    // Update quote
    await (this.ordersRepository as any).prisma.customQuote.update({
      where: { id: quoteId },
      data: { isAccepted: true },
    });

    // Update order with agreed price and status
    const updatedOrder = await this.ordersRepository.update(orderId, {
      agreedPrice: quote.proposedPrice,
      agreedDeposit: quote.proposedDeposit,
      status: OrderStatus.APPROVED_RESERVED,
    });

    // Notify seller
    await this.notificationsService.createCustomNotification(
      order.sellerId,
      'new_order',
      `Quote accepted for order ${order.orderNumber}`,
      `Buyer has accepted your quote`,
      { orderId: order.id, quoteId: quote.id }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('order.quote_accepted', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      quoteId: quote.id,
    });

    return this.serializeOrder(updatedOrder);
  }

  async getValidNextStates(orderId: string, user: AuthenticatedUser): Promise<OrderStatus[]> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify user is either buyer or seller
    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this order');
    }

    return this.stateMachine.getValidNextStates(order.type, order.status as OrderStatus);
  }

  async uploadPreHandoverPhotos(
    orderId: string,
    user: AuthenticatedUser,
    photoUrls: string[]
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only seller can upload pre-handover photos
    if (order.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can upload pre-handover photos');
    }

    // Validate photo URLs are from Cloudinary
    for (const url of photoUrls) {
      if (!url.includes('cloudinary')) {
        throw new BadRequestException('All photos must be uploaded via Cloudinary');
      }
    }

    const updatedOrder = await this.ordersRepository.update(orderId, {
      preHandoverPhotos: photoUrls,
    });

    // Notify buyer
    await this.notificationsService.createCustomNotification(
      order.buyerId,
      'new_order',
      `Pre-handover photos uploaded for order ${order.orderNumber}`,
      'Seller has uploaded verification photos before handover',
      { orderId: order.id }
    );

    return this.serializeOrder(updatedOrder);
  }

  async uploadPostReturnPhotos(
    orderId: string,
    user: AuthenticatedUser,
    photoUrls: string[]
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only seller can upload post-return photos
    if (order.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can upload post-return photos');
    }

    // Validate photo URLs are from Cloudinary
    for (const url of photoUrls) {
      if (!url.includes('cloudinary')) {
        throw new BadRequestException('All photos must be uploaded via Cloudinary');
      }
    }

    const updatedOrder = await this.ordersRepository.update(orderId, {
      postReturnPhotos: photoUrls,
    });

    // Notify buyer
    await this.notificationsService.createCustomNotification(
      order.buyerId,
      'new_order',
      `Post-return photos uploaded for order ${order.orderNumber}`,
      'Seller has uploaded inspection photos after return',
      { orderId: order.id }
    );

    return this.serializeOrder(updatedOrder);
  }

  async generateUploadSignature(count = 1) {
    this.uploadsService.assertConfigured();
    return this.uploadsService.createSignedUpload(count);
  }

  // ─── Seller Order Actions ────────────────────────────────────────────────

  async declineOrder(
    orderId: string,
    user: AuthenticatedUser,
    dto: DeclineOrderDto
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only seller can decline orders
    if (order.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can decline orders');
    }

    // Only allow decline for inquiry pending status
    if (order.status !== OrderStatus.INQUIRY_PENDING) {
      throw new BadRequestException('Only pending inquiries can be declined');
    }

    const declineReasonText = dto.reason === DeclineReason.OTHER
      ? dto.customReason || 'Other'
      : dto.reason;

    const updatedOrder = await this.ordersRepository.update(orderId, {
      status: OrderStatus.CANCELLED,
      disputeNotes: `Declined by seller: ${declineReasonText}`,
    });

    // Notify buyer
    await this.notificationsService.createCustomNotification(
      order.buyerId,
      'new_order',
      `Order ${order.orderNumber} declined`,
      `Seller declined your inquiry: ${declineReasonText}`,
      { orderId: order.id }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('order.declined', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      reason: declineReasonText,
    });

    return this.serializeOrder(updatedOrder);
  }

  async proposeAlternativeDates(
    orderId: string,
    user: AuthenticatedUser,
    dto: AlternativeDateSuggestionDto
  ): Promise<any> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only seller can propose alternative dates
    if (order.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can propose alternative dates');
    }

    // Only for rental orders
    if (order.type !== OrderType.RENTAL) {
      throw new BadRequestException('Alternative dates only available for rentals');
    }

    // Only for inquiry pending status
    if (order.status !== OrderStatus.INQUIRY_PENDING) {
      throw new BadRequestException('Alternative dates only available for pending inquiries');
    }

    // Store alternative dates in order metadata or create a separate entity
    const suggestion = await (this.ordersRepository as any).prisma.customQuote.create({
      data: {
        orderId,
        offeredByUserId: user.id,
        proposedPrice: Number(order.agreedPrice),
        proposedDeposit: order.agreedDeposit ? Number(order.agreedDeposit) : null,
        notes: dto.notes,
        metadata: {
          type: 'alternative_dates',
          alternativeDates: dto.alternativeDates.map(d => d.toISOString()),
        },
      },
    });

    // Update order status to quote proposed
    await this.ordersRepository.update(orderId, {
      status: OrderStatus.QUOTE_PROPOSED,
    });

    // Notify buyer
    await this.notificationsService.createCustomNotification(
      order.buyerId,
      'new_order',
      `Alternative dates suggested for order ${order.orderNumber}`,
      `Seller proposed ${dto.alternativeDates.length} alternative date option(s)`,
      { orderId: order.id, quoteId: suggestion.id }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('order.alternative_dates_proposed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      quoteId: suggestion.id,
      alternativeDates: dto.alternativeDates.map(d => d.toISOString()),
    });

    return suggestion;
  }

  async updateTailoringMilestone(
    orderId: string,
    user: AuthenticatedUser,
    dto: UpdateTailoringMilestoneDto
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only seller can update milestones
    if (order.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can update tailoring milestones');
    }

    // Only for custom tailoring orders
    if (order.type !== OrderType.CUSTOM_TAILORING) {
      throw new BadRequestException('Tailoring milestones only available for custom orders');
    }

    // Map milestone to order status
    const statusMap: Record<TailoringMilestone, OrderStatus> = {
      [TailoringMilestone.MEASUREMENTS_CONFIRMED]: OrderStatus.MEASUREMENTS_SUBMITTED,
      [TailoringMilestone.FABRIC_SELECTED_CUT]: OrderStatus.FABRIC_CUTTING,
      [TailoringMilestone.TAILORING_IN_PROGRESS]: OrderStatus.TAILORING_IN_PROGRESS,
      [TailoringMilestone.READY_FOR_FITTING]: OrderStatus.FITTING_READY,
    };

    const targetStatus = statusMap[dto.milestone];

    // Validate state transition
    this.stateMachine.validateTransition(order.type, order.status as OrderStatus, targetStatus);

    const updatedOrder = await this.ordersRepository.update(orderId, {
      status: targetStatus,
      ...(dto.notes && { disputeNotes: dto.notes }),
    });

    // Notify buyer
    await this.notificationsService.createCustomNotification(
      order.buyerId,
      'new_order',
      `Order ${order.orderNumber} progress update`,
      `Tailoring milestone: ${dto.milestone.replace(/_/g, ' ').toLowerCase()}`,
      { orderId: order.id, milestone: dto.milestone }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('order.tailoring_milestone_updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      milestone: dto.milestone,
      status: targetStatus,
    });

    return this.serializeOrder(updatedOrder);
  }

  async requestRentalExtension(
    orderId: string,
    user: AuthenticatedUser,
    dto: RequestExtensionDto
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only buyer can request extension
    if (order.buyerId !== user.id) {
      throw new ForbiddenException('Only buyers can request extensions');
    }

    // Only for rental orders
    if (order.type !== OrderType.RENTAL) {
      throw new BadRequestException('Extensions only available for rentals');
    }

    // Only for active rentals
    if (order.status !== OrderStatus.RENTAL_ACTIVE) {
      throw new BadRequestException('Extensions only available for active rentals');
    }

    const updatedOrder = await this.ordersRepository.update(orderId, {
      extensionDaysRequested: dto.extensionDays,
      extensionApproved: null,
    });

    // Notify seller
    await this.notificationsService.createCustomNotification(
      order.sellerId,
      'new_order',
      `Extension requested for order ${order.orderNumber}`,
      `Buyer requested ${dto.extensionDays} day extension${dto.reason ? `: ${dto.reason}` : ''}`,
      { orderId: order.id, extensionDays: dto.extensionDays }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('order.extension_requested', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      extensionDays: dto.extensionDays,
      reason: dto.reason,
    });

    return this.serializeOrder(updatedOrder);
  }

  async respondRentalExtension(
    orderId: string,
    user: AuthenticatedUser,
    dto: RespondExtensionDto
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only seller can respond to extension requests
    if (order.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can respond to extension requests');
    }

    if (order.extensionDaysRequested === 0) {
      throw new BadRequestException('No extension request pending');
    }

    let updatedOrder;
    if (dto.approved) {
      // Calculate new end date
      const currentEndDate = order.rentalEndDate ? new Date(order.rentalEndDate) : new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + order.extensionDaysRequested);

      updatedOrder = await this.ordersRepository.update(orderId, {
        extensionApproved: true,
        rentalEndDate: newEndDate,
      });
    } else {
      updatedOrder = await this.ordersRepository.update(orderId, {
        extensionApproved: false,
        extensionDaysRequested: 0,
      });
    }

    // Notify buyer
    await this.notificationsService.createCustomNotification(
      order.buyerId,
      'new_order',
      `Extension ${dto.approved ? 'approved' : 'declined'} for order ${order.orderNumber}`,
      dto.approved
        ? `Seller approved your ${order.extensionDaysRequested} day extension`
        : `Seller declined your extension request${dto.reason ? `: ${dto.reason}` : ''}`,
      { orderId: order.id, approved: dto.approved }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('order.extension_responded', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      approved: dto.approved,
      extensionDays: order.extensionDaysRequested,
      newEndDate: dto.approved ? updatedOrder.rentalEndDate?.toISOString() : null,
    });

    return this.serializeOrder(updatedOrder);
  }

  async completeOrderWithInspection(
    orderId: string,
    user: AuthenticatedUser,
    data: {
      condition: 'good' | 'damaged';
      damageNotes?: string;
      deductionAmount?: number;
    }
  ): Promise<SerializedOrder> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only seller can complete with inspection
    if (order.sellerId !== user.id) {
      throw new ForbiddenException('Only sellers can complete orders with inspection');
    }

    // Only for rentals or completed returns
    const validStatuses = [OrderStatus.RETURNED_INSPECTED, OrderStatus.RETURN_INITIATED];
    if (!validStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException('Order must be returned before completion');
    }

    let targetStatus = OrderStatus.COMPLETED;
    let disputeNotes = order.disputeNotes;

    if (data.condition === 'damaged') {
      targetStatus = OrderStatus.DISPUTED;
      disputeNotes = `Item returned damaged: ${data.damageNotes || 'No details provided'}. Deduction: ${data.deductionAmount || 0}`;
    } else {
      // Mark deposit as refunded
      await this.ordersRepository.update(orderId, {
        offlineDepositRefunded: true,
      });
    }

    const updatedOrder = await this.ordersRepository.update(orderId, {
      status: targetStatus,
      disputeNotes,
    });

    // Notify buyer
    await this.notificationsService.createCustomNotification(
      order.buyerId,
      'new_order',
      `Order ${order.orderNumber} ${data.condition === 'good' ? 'completed' : 'disputed'}`,
      data.condition === 'good'
        ? 'Item returned in good condition. Deposit refunded.'
        : `Item returned damaged. ${data.deductionAmount ? `Deduction: ${data.deductionAmount}` : 'Dispute opened for review.'}`,
      { orderId: order.id, condition: data.condition }
    );

    // Emit Socket.IO event
    this.eventEmitter.emit('order.status_updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      status: targetStatus,
      condition: data.condition,
      deductionAmount: data.deductionAmount,
    });

    return this.serializeOrder(updatedOrder);
  }
}

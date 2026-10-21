import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConversationsRepository } from '../chat/conversations.repository';
import { MessagesRepository } from '../chat/messages.repository';
import { RentalsRepository } from './rentals.repository';
import { CreateRentalOrderDto, RentalPricingTier } from './dto/create-rental-order.dto';
import type { UpdateRentalOrderDto } from './dto/update-rental-order.dto';
import type { RentalQueryDto } from './dto/rental-query.dto';
import type { CreateRentalExtensionDto } from './dto/create-rental-extension.dto';
import type { CreateConditionLogDto } from './dto/create-condition-log.dto';
import type { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';
import type { SuggestDatesDto } from './dto/suggest-dates.dto';
import type { RespondDatesDto } from './dto/respond-dates.dto';
import type { DeclineRentalDto } from './dto/decline-rental.dto';
import type { CancelRentalDto } from './dto/cancel-rental.dto';
import type { ConfirmReturnDto } from './dto/confirm-return.dto';
import type { InitiateReturnDto } from './dto/initiate-return.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';

/**
 * Calendar date normalizer: prevents timezone skew where UTC conversion
 * shifts dates back/forward by a day.
 */
function parseCalendarDate(dateStr: string | Date, isEndOfDay = false): Date {
  if (dateStr instanceof Date) {
    const y = dateStr.getUTCFullYear();
    const m = dateStr.getUTCMonth();
    const d = dateStr.getUTCDate();
    return new Date(
      Date.UTC(y, m, d, isEndOfDay ? 23 : 0, isEndOfDay ? 59 : 0, isEndOfDay ? 59 : 0, isEndOfDay ? 999 : 0),
    );
  }
  const str = String(dateStr).trim();
  const datePart = str.split('T')[0] ?? '';
  const parts = datePart.split('-');
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(
      Date.UTC(y, m, d, isEndOfDay ? 23 : 0, isEndOfDay ? 59 : 0, isEndOfDay ? 59 : 0, isEndOfDay ? 999 : 0),
    );
  }
  const parsed = new Date(str);
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
      isEndOfDay ? 23 : 0,
      isEndOfDay ? 59 : 0,
      isEndOfDay ? 59 : 0,
      isEndOfDay ? 999 : 0,
    ),
  );
}

function calculateDays(start: Date, end: Date): number {
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

function formatDateString(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

@Injectable()
export class RentalsService {
  private readonly logger = new Logger(RentalsService.name);

  constructor(
    private readonly repository: RentalsRepository,
    private readonly prisma: PrismaService,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly conversationsRepository: ConversationsRepository,
    private readonly messagesRepository: MessagesRepository,
    @InjectQueue(QUEUE_NAMES.RENTAL_EXPIRATION) private readonly expirationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.RENTAL_REMINDERS) private readonly remindersQueue: Queue,
  ) {}

  async findAll(query: RentalQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RentalOrderWhereInput = {
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.listingId ? { listingId: query.listingId } : {}),
      ...(query.renterId ? { renterId: query.renterId } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.startDateFrom || query.startDateTo
        ? {
            startDate: {
              ...(query.startDateFrom ? { gte: parseCalendarDate(query.startDateFrom, false) } : {}),
              ...(query.startDateTo ? { lte: parseCalendarDate(query.startDateTo, true) } : {}),
            },
          }
        : {}),
      ...(query.endDateFrom || query.endDateTo
        ? {
            endDate: {
              ...(query.endDateFrom ? { gte: parseCalendarDate(query.endDateFrom, false) } : {}),
              ...(query.endDateTo ? { lte: parseCalendarDate(query.endDateTo, true) } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.RentalOrderOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    const [items, total] = await Promise.all([
      this.repository.findMany({ where, orderBy, skip, take: limit }),
      this.repository.count(where),
    ]);

    const processedItems = await Promise.all(items.map((r) => this.processRentalOverdue(r)));

    return toPaginatedResponse({ items: processedItems, total, page, limit });
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    const rental = await this.repository.findById(id);
    if (!rental) {
      throw new NotFoundException('Rental order not found');
    }

    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      if (rental.renterId !== user.id && rental.sellerId !== user.id) {
        throw new ForbiddenException('You are not authorized to view this rental');
      }
    }

    const processed = await this.processRentalOverdue(rental);

    return {
      success: true,
      data: processed,
    };
  }

  async checkAvailability(listingId: string, startDateStr: string, endDateStr: string) {
    if (!startDateStr || !endDateStr) {
      throw new BadRequestException('Start date and end date are required');
    }
    const startDate = parseCalendarDate(startDateStr, false);
    const endDate = parseCalendarDate(endDateStr, true);

    if (startDate >= endDate) {
      return {
        available: false,
        message: 'End date must be after start date',
      };
    }

    const available = await this.repository.checkAvailability(listingId, startDate, endDate);
    return {
      available,
      message: available
        ? 'Dates are available'
        : 'These dates are no longer available. Please select different dates.',
    };
  }

  async getBookedDateRanges(listingId: string) {
    return this.repository.getBookedDateRanges(listingId);
  }

  async create(dto: CreateRentalOrderDto, user: AuthenticatedUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: {
        id: true,
        title: true,
        rentalPricePerDay: true,
        rentalThreeDayRate: true,
        rentalWeeklyRate: true,
        rentalDeposit: true,
        sellerId: true,
        availableForRent: true,
        minRentalDurationDays: true,
        maxRentalDurationDays: true,
        rentalPickupLocation: true,
        rentalNotes: true,
        city: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException('Listing not found');
    }

    if (!listing.availableForRent) {
      throw new BadRequestException('This listing is not available for rent');
    }

    if (listing.sellerId === user.id) {
      throw new BadRequestException('You cannot rent your own listing');
    }

    const startDate = parseCalendarDate(dto.startDate, false);
    const endDate = parseCalendarDate(dto.endDate, true);

    const todayStart = parseCalendarDate(new Date(), false);
    if (startDate < todayStart) {
      throw new BadRequestException('Rental start date cannot be in the past');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Duration calculation
    const days = calculateDays(startDate, endDate);
    const minDays = listing.minRentalDurationDays ?? 1;
    if (days < minDays) {
      throw new BadRequestException(
        `Minimum rental duration is ${minDays} day${minDays > 1 ? 's' : ''}`,
      );
    }
    if (listing.maxRentalDurationDays && days > listing.maxRentalDurationDays) {
      throw new BadRequestException(
        `Maximum rental duration is ${listing.maxRentalDurationDays} days`,
      );
    }

    // Server-side availability validation against accepted/active rentals & blackout dates
    const isAvailable = await this.repository.checkAvailability(dto.listingId, startDate, endDate);
    if (!isAvailable) {
      throw new BadRequestException(
        'These dates are no longer available. Please select different dates.',
      );
    }

    // Pricing calculation & snapshot preservation
    const dailyRate = Number(listing.rentalPricePerDay || 0);
    if (dailyRate <= 0) {
      throw new BadRequestException('Listing does not have a valid rental rate configured');
    }

    let totalAmount = 0;
    let pricingTierUsed = dto.pricingTier;

    // Auto-detect tier if not explicitly specified
    if (!pricingTierUsed) {
      if (days >= 7 && listing.rentalWeeklyRate) {
        pricingTierUsed = RentalPricingTier.WEEKLY;
      } else if (days >= 3 && listing.rentalThreeDayRate && days < 7) {
        pricingTierUsed = RentalPricingTier.THREE_DAY_EVENT;
      } else {
        pricingTierUsed = RentalPricingTier.DAILY;
      }
    }

    switch (pricingTierUsed) {
      case RentalPricingTier.THREE_DAY_EVENT:
      case 'THREE_DAY_EVENT':
        if (listing.rentalThreeDayRate) {
          const threeDayRate = Number(listing.rentalThreeDayRate);
          totalAmount = days === 3 ? threeDayRate : threeDayRate + Math.max(0, days - 3) * dailyRate;
        } else {
          totalAmount = days * dailyRate;
        }
        break;
      case RentalPricingTier.WEEKLY:
      case 'WEEKLY':
        if (listing.rentalWeeklyRate) {
          const weeklyRate = Number(listing.rentalWeeklyRate);
          totalAmount = days === 7 ? weeklyRate : weeklyRate + Math.max(0, days - 7) * dailyRate;
        } else {
          totalAmount = days * dailyRate;
        }
        break;
      default:
        totalAmount = days * dailyRate;
    }

    const securityDeposit = Number(listing.rentalDeposit || 0);
    const pickupLocation =
      dto.pickupLocation ||
      dto.handoverLocation ||
      listing.rentalPickupLocation ||
      listing.city ||
      'Seller pickup';
    const rentalNotes = dto.rentalNotes || listing.rentalNotes || null;

    // Stable, readable Order Number
    const orderNumber = `RNT-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

    const data: Prisma.RentalOrderCreateInput = {
      orderNumber,
      listing: { connect: { id: dto.listingId } },
      renter: { connect: { id: user.id } },
      seller: { connect: { id: listing.sellerId } },
      startDate,
      endDate,
      rentalDurationDays: days,
      dailyRate,
      totalAmount,
      securityDeposit,
      status: 'PENDING',
      pricingTierUsed: pricingTierUsed as any,
      pickupLocation,
      handoverLocation: pickupLocation,
      rentalNotes,
      renterNotes: dto.renterNotes || null,
      ...(dto.pickupHub ? { pickupHub: dto.pickupHub } : {}),
      ...(dto.preHandoverCondition ? { preHandoverCondition: dto.preHandoverCondition } : {}),
      ...(dto.preHandoverPhotos ? { preHandoverPhotos: dto.preHandoverPhotos } : {}),
    };

    const created = await this.repository.create(data);

    // Record initial history
    try {
      await this.repository.createHistory({
        rentalOrderId: created.id,
        actorId: user.id,
        action: 'CREATED',
        fromStatus: null,
        toStatus: 'PENDING',
        notes: dto.renterNotes || null,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          durationDays: days,
          totalAmount,
          securityDeposit,
        },
      });
    } catch {
      // non-fatal
    }

    // Schedule auto-expiration (24 hours)
    try {
      await this.expirationQueue.add(
        'rental-expiration',
        {
          rentalOrderId: created.id,
          renterId: user.id,
          sellerId: listing.sellerId,
          listingId: dto.listingId,
        },
        {
          delay: 24 * 60 * 60 * 1000,
        },
      );
    } catch {
      // non-fatal
    }

    // Notify seller
    try {
      await this.notificationsService.createCustomNotification(
        listing.sellerId,
        'rental_request_received',
        'New Rental Request',
        `You have a new rental request for "${listing.title}" (${formatDateString(startDate)} – ${formatDateString(endDate)})`,
        { listingId: dto.listingId, rentalOrderId: created.id },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: created,
    };
  }

  /**
   * Seller accepts rental request.
   * - Re-validates date availability
   * - Sets status to ACCEPTED
   * - Automatically declines concurrent pending requests for overlapping dates
   * - Creates/links conversation and sends structured confirmation message in chat
   * - Dispatches notification
   */
  async approve(id: string, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.status !== 'PENDING' && existing.status !== 'REQUESTED') {
      throw new BadRequestException('Only pending rental requests can be accepted');
    }

    if (existing.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can accept rental requests');
    }

    // Re-validate dates again server-side before accepting
    const isAvailable = await this.repository.checkAvailability(
      existing.listingId,
      existing.startDate,
      existing.endDate,
      existing.id,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'These dates are no longer available. A conflicting rental has already been accepted.',
      );
    }

    const updated = await this.repository.update(id, {
      status: 'ACCEPTED',
    });

    // Automatically decline concurrent pending requests for overlapping dates
    await this.repository.cancelConcurrentPendingRequests(
      existing.listingId,
      existing.startDate,
      existing.endDate,
      id,
    );

    // Record history
    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'ACCEPTED',
        fromStatus: existing.status,
        toStatus: 'ACCEPTED',
      });
    } catch {
      // non-fatal
    }

    // Connect to Chat & send structured confirmation message
    let conversationId: string | null = null;
    try {
      const conv =
        (await this.conversationsRepository.findByParticipants(
          existing.renterId,
          existing.sellerId,
          { listingId: existing.listingId, rentalId: existing.id },
        )) ||
        (await this.conversationsRepository.create({
          buyerId: existing.renterId,
          sellerId: existing.sellerId,
          listingId: existing.listingId,
          rentalId: existing.id,
        }));

      conversationId = conv.id;

      const startFormatted = formatDateString(existing.startDate);
      const endFormatted = formatDateString(existing.endDate);
      const durationDays =
        existing.rentalDurationDays || calculateDays(existing.startDate, existing.endDate);
      const pickupInfo =
        existing.pickupLocation ||
        existing.listing?.rentalPickupLocation ||
        existing.listing?.city ||
        'Seller pickup';

      const structuredMessage = [
        'Rental Request Accepted ✓',
        '',
        `Item: ${existing.listing.title}`,
        `Rental dates: ${startFormatted} – ${endFormatted}`,
        `Duration: ${durationDays} day${durationDays > 1 ? 's' : ''}`,
        `Rental fee: ${existing.totalAmount.toLocaleString()} ETB`,
        `Security deposit: ${existing.securityDeposit.toLocaleString()} ETB`,
        `Pickup: ${pickupInfo}`,
        '',
        'Please coordinate payment and pickup directly with the seller.',
      ].join('\n');

      await this.messagesRepository.create({
        conversationId: conv.id,
        senderId: user.id,
        content: structuredMessage,
        messageType: 'TEXT',
      });

      await this.conversationsRepository.update(conv.id, {
        lastMessageAt: new Date(),
      });
    } catch (err) {
      // Log chat linking error non-fatal
      console.error('Failed to send structured chat message on rental acceptance:', err);
    }

    // Schedule pre-return reminder (12 hours before end date)
    const preReturnDelay = existing.endDate.getTime() - Date.now() - 12 * 60 * 60 * 1000;
    if (preReturnDelay > 0) {
      try {
        await this.remindersQueue.add(
          'rental-reminder',
          {
            type: 'pre_return',
            rentalOrderId: id,
            renterId: existing.renterId,
            sellerId: existing.sellerId,
            endDate: existing.endDate.toISOString(),
            hoursUntil: 12,
          },
          { delay: preReturnDelay },
        );
      } catch {
        // non-fatal
      }
    }

    // Schedule overdue reminder (when end date is reached)
    const overdueDelay = existing.endDate.getTime() - Date.now();
    if (overdueDelay > 0) {
      try {
        await this.remindersQueue.add(
          'rental-reminder',
          {
            type: 'overdue',
            rentalOrderId: id,
            renterId: existing.renterId,
            sellerId: existing.sellerId,
            endDate: existing.endDate.toISOString(),
            daysOverdue: 1,
          },
          { delay: overdueDelay, jobId: `rental-overdue-${id}` },
        );
      } catch {
        // non-fatal
      }
    }

    // Notify renter
    try {
      await this.notificationsService.createCustomNotification(
        existing.renterId,
        'rental_request_accepted',
        'Rental Request Accepted',
        `Your rental request for "${existing.listing.title}" has been accepted! Please open chat to coordinate payment and pickup.`,
        { rentalOrderId: id, conversationId },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
      conversationId,
    };
  }

  /**
   * Seller suggests alternative dates for a pending rental request.
   */
  async suggestDates(id: string, dto: SuggestDatesDto, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.status !== 'PENDING' && existing.status !== 'REQUESTED') {
      throw new BadRequestException('Can only suggest dates for pending requests');
    }

    if (existing.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can suggest alternative dates');
    }

    const suggestedStart = parseCalendarDate(dto.startDate, false);
    const suggestedEnd = parseCalendarDate(dto.endDate, true);
    const todayStart = parseCalendarDate(new Date(), false);

    if (suggestedStart < todayStart) {
      throw new BadRequestException('Suggested start date cannot be in the past');
    }

    if (suggestedStart >= suggestedEnd) {
      throw new BadRequestException('Suggested return date must be after start date');
    }

    const days = calculateDays(suggestedStart, suggestedEnd);
    const minDays = existing.listing?.minRentalDurationDays ?? 1;
    if (days < minDays) {
      throw new BadRequestException(`Suggested duration must be at least ${minDays} days`);
    }

    // Validate availability of suggested dates
    const isAvailable = await this.repository.checkAvailability(
      existing.listingId,
      suggestedStart,
      suggestedEnd,
      existing.id,
    );
    if (!isAvailable) {
      throw new BadRequestException('The suggested dates are already booked by another rental');
    }

    const updated = await this.repository.update(id, {
      suggestedStartDate: suggestedStart,
      suggestedEndDate: suggestedEnd,
      suggestedBy: user.id,
    });

    // Record history
    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'DATES_SUGGESTED',
        fromStatus: existing.status,
        toStatus: existing.status,
        notes: dto.notes || null,
        metadata: {
          suggestedStartDate: suggestedStart.toISOString(),
          suggestedEndDate: suggestedEnd.toISOString(),
          durationDays: days,
        },
      });
    } catch {
      // non-fatal
    }

    // Notify renter
    try {
      await this.notificationsService.createCustomNotification(
        existing.renterId,
        'rental_status_changed',
        'Alternative Rental Dates Suggested',
        `Seller suggested new dates for "${existing.listing.title}": ${formatDateString(suggestedStart)} – ${formatDateString(suggestedEnd)}.`,
        { rentalOrderId: id },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Renter accepts or declines suggested alternative dates.
   */
  async respondSuggestedDates(id: string, dto: RespondDatesDto, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.renterId !== user.id) {
      throw new ForbiddenException('Only the renter can respond to suggested dates');
    }

    if (!existing.suggestedStartDate || !existing.suggestedEndDate) {
      throw new BadRequestException('No suggested dates exist for this rental request');
    }

    if (dto.accept) {
      // Re-validate availability
      const isAvailable = await this.repository.checkAvailability(
        existing.listingId,
        existing.suggestedStartDate,
        existing.suggestedEndDate,
        existing.id,
      );

      if (!isAvailable) {
        throw new BadRequestException(
          'These suggested dates are no longer available. Please coordinate with the seller.',
        );
      }

      const newDays = calculateDays(existing.suggestedStartDate, existing.suggestedEndDate);
      const newTotal = newDays * Number(existing.dailyRate);

      const updated = await this.repository.update(id, {
        startDate: existing.suggestedStartDate,
        endDate: existing.suggestedEndDate,
        rentalDurationDays: newDays,
        totalAmount: newTotal,
        suggestedStartDate: null,
        suggestedEndDate: null,
        suggestedBy: null,
      });

      try {
        await this.repository.createHistory({
          rentalOrderId: id,
          actorId: user.id,
          action: 'DATES_ACCEPTED',
          notes: 'Renter accepted suggested dates',
          metadata: {
            newStartDate: existing.suggestedStartDate.toISOString(),
            newEndDate: existing.suggestedEndDate.toISOString(),
            durationDays: newDays,
            totalAmount: newTotal,
          },
        });
      } catch {
        // non-fatal
      }

      // Notify seller
      try {
        await this.notificationsService.createCustomNotification(
          existing.sellerId,
          'rental_status_changed',
          'Suggested Dates Accepted',
          `Renter accepted the suggested dates for "${existing.listing.title}". You can now accept the rental request.`,
          { rentalOrderId: id },
        );
      } catch {
        // non-fatal
      }

      return {
        success: true,
        data: updated,
      };
    } else {
      // Declined suggested dates
      const updated = await this.repository.update(id, {
        suggestedStartDate: null,
        suggestedEndDate: null,
        suggestedBy: null,
      });

      try {
        await this.repository.createHistory({
          rentalOrderId: id,
          actorId: user.id,
          action: 'DATES_DECLINED',
          notes: dto.reason || 'Renter declined suggested dates',
        });
      } catch {
        // non-fatal
      }

      // Notify seller
      try {
        await this.notificationsService.createCustomNotification(
          existing.sellerId,
          'rental_status_changed',
          'Suggested Dates Declined',
          `Renter declined the suggested dates for "${existing.listing.title}".`,
          { rentalOrderId: id },
        );
      } catch {
        // non-fatal
      }

      return {
        success: true,
        data: updated,
      };
    }
  }

  /**
   * Seller declines pending rental request.
   */
  async decline(id: string, dto: DeclineRentalDto, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.status !== 'PENDING' && existing.status !== 'REQUESTED') {
      throw new BadRequestException('Only pending rental requests can be declined');
    }

    if (existing.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can decline this rental request');
    }

    const reason = dto.reason || 'Item unavailable for selected dates';

    const updated = await this.repository.update(id, {
      status: 'DECLINED',
      declineReason: reason,
      cancellationReason: reason,
    });

    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'DECLINED',
        fromStatus: existing.status,
        toStatus: 'DECLINED',
        notes: reason,
      });
    } catch {
      // non-fatal
    }

    // Notify renter
    try {
      await this.notificationsService.createCustomNotification(
        existing.renterId,
        'rental_request_rejected',
        'Rental Request Declined',
        `Your rental request for "${existing.listing.title}" was declined: ${reason}`,
        { rentalOrderId: id },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Cancel rental request (renter or seller).
   */
  async cancel(id: string, dto: CancelRentalDto, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    const isRenter = existing.renterId === user.id;
    const isSeller = existing.sellerId === user.id;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    if (!isRenter && !isSeller && !isAdmin) {
      throw new ForbiddenException('You are not authorized to cancel this rental');
    }

    const allowedCancelStatuses = [
      'PENDING',
      'REQUESTED',
      'ACCEPTED',
      'APPROVED',
      'READY_FOR_PICKUP',
      'HANDOVER_PENDING',
    ];

    if (!allowedCancelStatuses.includes(existing.status)) {
      throw new BadRequestException(
        `Cannot cancel rental in "${existing.status}" status. Only pending or pre-pickup rentals can be cancelled.`,
      );
    }

    const reason = dto.reason || (isRenter ? 'Cancelled by renter' : 'Cancelled by seller');

    const updated = await this.repository.update(id, {
      status: 'CANCELLED',
      cancelledBy: user.id,
      cancelledAt: new Date(),
      cancellationReason: reason,
    });

    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'CANCELLED',
        fromStatus: existing.status,
        toStatus: 'CANCELLED',
        notes: reason,
      });
    } catch {
      // non-fatal
    }

    // Notify other party
    const notifyId = isRenter ? existing.sellerId : existing.renterId;
    try {
      await this.notificationsService.createCustomNotification(
        notifyId,
        'rental_status_changed',
        'Rental Request Cancelled',
        `Rental request for "${existing.listing.title}" was cancelled: ${reason}`,
        { rentalOrderId: id },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Seller marks item ready for pickup.
   */
  async markReadyForPickup(id: string, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can mark item as ready for pickup');
    }

    if (existing.status !== 'ACCEPTED' && existing.status !== 'APPROVED') {
      throw new BadRequestException('Item can only be marked ready after request is accepted');
    }

    const updated = await this.repository.update(id, {
      status: 'READY_FOR_PICKUP',
    });

    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'READY_FOR_PICKUP',
        fromStatus: existing.status,
        toStatus: 'READY_FOR_PICKUP',
      });
    } catch {
      // non-fatal
    }

    try {
      await this.notificationsService.createCustomNotification(
        existing.renterId,
        'rental_status_changed',
        'Rental Ready For Pickup',
        `Your rented item "${existing.listing.title}" is ready for pickup! Please coordinate pickup details with the seller.`,
        { rentalOrderId: id },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Seller marks item as picked up / starts rental possession -> ACTIVE.
   */
  async startRental(id: string, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can start the rental');
    }

    const allowed = ['ACCEPTED', 'APPROVED', 'READY_FOR_PICKUP', 'HANDOVER_PENDING'];
    if (!allowed.includes(existing.status)) {
      throw new BadRequestException('Rental must be accepted or ready for pickup to start');
    }

    const updated = await this.repository.update(id, {
      status: 'ACTIVE',
      handoverAt: new Date(),
    });

    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'STARTED',
        fromStatus: existing.status,
        toStatus: 'ACTIVE',
      });
    } catch {
      // non-fatal
    }

    try {
      await this.notificationsService.createCustomNotification(
        existing.renterId,
        'rental_status_changed',
        'Rental Active',
        `Your rental for "${existing.listing.title}" is now active! Return is scheduled for ${formatDateString(existing.endDate)}.`,
        { rentalOrderId: id },
      );
    } catch {
      // non-fatal
    }

    // Schedule pre-return reminder (12 hours before end date)
    const preReturnDelay = existing.endDate.getTime() - Date.now() - 12 * 60 * 60 * 1000;
    if (preReturnDelay > 0) {
      try {
        await this.remindersQueue.add(
          'rental-reminder',
          {
            type: 'pre_return',
            rentalOrderId: id,
            renterId: existing.renterId,
            sellerId: existing.sellerId,
            endDate: existing.endDate.toISOString(),
            hoursUntil: 12,
          },
          { delay: preReturnDelay },
        );
      } catch {
        // non-fatal
      }
    }

    // Schedule overdue reminder (when end date is reached)
    const overdueDelay = existing.endDate.getTime() - Date.now();
    if (overdueDelay > 0) {
      try {
        await this.remindersQueue.add(
          'rental-reminder',
          {
            type: 'overdue',
            rentalOrderId: id,
            renterId: existing.renterId,
            sellerId: existing.sellerId,
            endDate: existing.endDate.toISOString(),
            daysOverdue: 1,
          },
          { delay: overdueDelay, jobId: `rental-overdue-${id}` },
        );
      } catch {
        // non-fatal
      }
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Initiate return (renter or seller) -> RETURN_PENDING.
   * Calculates overdue penalty fee if returning past scheduled end date.
   */
  async initiateReturn(id: string, user: AuthenticatedUser, dto?: InitiateReturnDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.renterId !== user.id && existing.sellerId !== user.id) {
      throw new ForbiddenException('Only the renter or seller can initiate return');
    }

    if (existing.status !== 'ACTIVE') {
      throw new BadRequestException('Only active rentals can initiate return');
    }

    const now = new Date();
    const isOverdue = existing.endDate.getTime() < now.getTime();
    const overdueDays = isOverdue
      ? Math.max(1, Math.ceil((now.getTime() - existing.endDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const dailyLateRate = Number(
      (existing.listing as any)?.attributes?.lateFeePerDay ??
      existing.dailyRate ??
      (existing.listing?.rentalPricePerDay ? Number(existing.listing.rentalPricePerDay) : 0)
    );
    const calculatedPenalty = overdueDays * dailyLateRate;

    const updatePayload: Prisma.RentalOrderUpdateInput = {
      status: 'RETURN_PENDING',
    };

    if (isOverdue && calculatedPenalty > 0) {
      updatePayload.penaltyFee = calculatedPenalty;
      updatePayload.penaltyDays = overdueDays;
    }

    if (dto?.notes) {
      updatePayload.renterNotes = existing.renterNotes
        ? `${existing.renterNotes}\n[Return]: ${dto.notes}`
        : `[Return]: ${dto.notes}`;
    }

    if (dto?.returnCondition) {
      updatePayload.postReturnCondition = dto.returnCondition;
    }

    const updated = await this.repository.update(id, updatePayload);

    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'RETURN_INITIATED',
        fromStatus: existing.status,
        toStatus: 'RETURN_PENDING',
        notes: dto?.notes || (isOverdue ? `Return initiated (${overdueDays}d overdue, penalty: ${calculatedPenalty} ETB)` : null),
        metadata: {
          isOverdue,
          overdueDays,
          penaltyFee: calculatedPenalty,
          notes: dto?.notes || null,
          returnCondition: dto?.returnCondition || null,
        },
      });
    } catch {
      // non-fatal
    }

    // Notify seller
    try {
      const sellerMsg = isOverdue
        ? `Renter marked "${existing.listing.title}" as returned (${overdueDays} day(s) overdue). Accrued penalty: ${calculatedPenalty.toLocaleString()} ETB. Please verify condition and collect penalty before confirming return.`
        : `Return process initiated for "${existing.listing.title}". Please confirm item return upon inspection.`;

      await this.notificationsService.createCustomNotification(
        existing.sellerId,
        'rental_status_changed',
        isOverdue ? 'Overdue Rental Return Initiated' : 'Rental Return Initiated',
        sellerMsg,
        { rentalOrderId: id, overdueDays, penaltyFee: calculatedPenalty },
      );
    } catch {
      // non-fatal
    }

    // If renter initiated return and item is overdue, notify renter about penalty settlement obligation
    if (user.id === existing.renterId && isOverdue) {
      try {
        await this.notificationsService.createCustomNotification(
          existing.renterId,
          'rental_status_changed',
          'Return Initiated — Penalty Settlement Required',
          `You have marked "${existing.listing.title}" as returned (${overdueDays} day(s) overdue). Accrued penalty fee is ${calculatedPenalty.toLocaleString()} ETB. Please settle this directly with the seller.`,
          { rentalOrderId: id, penaltyFee: calculatedPenalty, overdueDays },
        );
      } catch {
        // non-fatal
      }
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Seller confirms item return -> COMPLETED.
   * Renter review becomes available.
   */
  async confirmReturn(id: string, user: AuthenticatedUser, dto?: ConfirmReturnDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can confirm return');
    }

    const allowed = [
      'ACTIVE',
      'RETURN_PENDING',
      'RETURN_INITIATED',
      'RETURNED_INSPECTED',
      'RETURNED_PENDING_INSPECTION',
    ];
    if (!allowed.includes(existing.status)) {
      throw new BadRequestException('Rental must be active or return pending to complete');
    }

    const now = new Date();
    const isOverdue = existing.endDate.getTime() < now.getTime();
    const overdueDays = isOverdue
      ? Math.max(1, Math.ceil((now.getTime() - existing.endDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const dailyLateRate = Number(
      (existing.listing as any)?.attributes?.lateFeePerDay ??
      existing.dailyRate ??
      (existing.listing?.rentalPricePerDay ? Number(existing.listing.rentalPricePerDay) : 0)
    );
    const calculatedPenalty = overdueDays * dailyLateRate;

    // If rental is overdue with a penalty fee, seller must verify penalty payment
    if (isOverdue && calculatedPenalty > 0) {
      if (!dto?.penaltyPaid) {
        throw new BadRequestException(
          `This rental is overdue by ${overdueDays} day(s) with an accrued penalty fee of ${calculatedPenalty.toLocaleString()} ETB. You must verify that the tenant has paid or settled the penalty fee before confirming return.`
        );
      }
    }

    const finalPenaltyFee = isOverdue
      ? (dto?.penaltyAmount !== undefined ? dto.penaltyAmount : calculatedPenalty)
      : (existing.penaltyFee ?? 0);

    const updated = await this.repository.update(id, {
      status: 'COMPLETED',
      returnedAt: now,
      actualReturnDate: now,
      penaltyFee: finalPenaltyFee,
      penaltyDays: isOverdue ? overdueDays : (existing.penaltyDays ?? 0),
      penaltyPaid: isOverdue ? Boolean(dto?.penaltyPaid) : Boolean(existing.penaltyPaid),
      penaltyPaidAt: isOverdue && dto?.penaltyPaid ? now : existing.penaltyPaidAt,
      penaltyNotes: isOverdue
        ? (dto?.penaltyNotes ?? (dto?.settlementMethod ? `Settled via: ${dto.settlementMethod}` : 'Tenant penalty fee verified and collected'))
        : existing.penaltyNotes,
    });

    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'RETURN_CONFIRMED',
        fromStatus: existing.status,
        toStatus: 'COMPLETED',
        notes: isOverdue
          ? `Penalty fee of ${finalPenaltyFee} ETB (${overdueDays}d overdue) verified paid. Settlement: ${dto?.settlementMethod || 'Direct'}. ${dto?.penaltyNotes || ''}`.trim()
          : null,
        metadata: {
          penaltyFee: finalPenaltyFee,
          penaltyDays: isOverdue ? overdueDays : 0,
          penaltyPaid: isOverdue ? Boolean(dto?.penaltyPaid) : false,
          settlementMethod: dto?.settlementMethod ?? null,
          penaltyNotes: dto?.penaltyNotes ?? null,
        },
      });
    } catch {
      // non-fatal
    }

    // Notify renter that rental is completed and penalty was settled if applicable
    try {
      const penaltyNote = isOverdue && finalPenaltyFee > 0
        ? ` Late penalty fee of ${finalPenaltyFee.toLocaleString()} ETB was verified as settled.`
        : '';
      await this.notificationsService.createCustomNotification(
        existing.renterId,
        'rental_status_changed',
        'Rental Completed & Return Verified',
        `Your return of "${existing.listing.title}" has been confirmed by the seller.${penaltyNote} Leave a review to share your experience!`,
        { rentalOrderId: id, listingId: existing.listingId, penaltyFee: finalPenaltyFee },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Rental Extension: Renter requests extension for an active rental.
   */
  async createExtension(rentalOrderId: string, dto: CreateRentalExtensionDto, user: AuthenticatedUser) {
    const rental = await this.repository.findById(rentalOrderId);
    if (!rental) {
      throw new NotFoundException('Rental order not found');
    }

    if (rental.renterId !== user.id) {
      throw new ForbiddenException('Only the renter can request an extension');
    }

    if (rental.status !== 'ACTIVE') {
      throw new BadRequestException('Extensions can only be requested for active rentals');
    }

    const rawTargetDate = dto.newEndDate || dto.requestedEndDate;
    if (!rawTargetDate) {
      throw new BadRequestException('New requested return date is required');
    }

    const newEndDate = parseCalendarDate(rawTargetDate, true);
    if (newEndDate <= rental.endDate) {
      throw new BadRequestException('New return date must be after current return date');
    }

    const todayStart = parseCalendarDate(new Date(), false);
    if (newEndDate < todayStart) {
      throw new BadRequestException('New extension date cannot be in the past');
    }

    // Calculate additional days
    const additionalDays =
      dto.additionalDays && dto.additionalDays >= 1
        ? dto.additionalDays
        : calculateDays(rental.endDate, newEndDate);

    const dailyRate = Number(
      rental.dailyRate ??
      (rental.listing as any)?.rentalPricePerDay ??
      0
    );
    const additionalCost = additionalDays * dailyRate;

    // Validate availability for the extension period
    const isAvailable = await this.repository.checkAvailability(
      rental.listingId,
      rental.endDate,
      newEndDate,
      rental.id,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'The requested extension dates conflict with an upcoming booking for this item.',
      );
    }

    const data: Prisma.RentalExtensionCreateInput = {
      rentalOrder: { connect: { id: rentalOrderId } },
      requestedByUser: { connect: { id: user.id } },
      additionalDays,
      newEndDate,
      additionalCost,
      status: 'PENDING',
    };

    const extension = await this.repository.createExtension(data);

    try {
      await this.repository.createHistory({
        rentalOrderId,
        actorId: user.id,
        action: 'EXTENSION_REQUESTED',
        notes: dto.reason || null,
        metadata: {
          newEndDate: newEndDate.toISOString(),
          additionalDays,
          additionalCost,
        },
      });
    } catch {
      // non-fatal
    }

    // Notify seller
    try {
      await this.notificationsService.createCustomNotification(
        rental.sellerId,
        'rental_status_changed',
        'Rental Extension Request',
        `Renter requested a ${additionalDays}-day extension for "${rental.listing.title}" until ${formatDateString(newEndDate)} (+${additionalCost.toLocaleString()} ETB).`,
        { rentalOrderId, extensionId: extension.id },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: extension,
    };
  }

  /**
   * Seller accepts or declines rental extension request.
   */
  async approveExtension(extensionId: string, user: AuthenticatedUser) {
    const extension = await this.prisma.rentalExtension.findUnique({
      where: { id: extensionId },
      include: { rentalOrder: { include: { listing: true } } },
    });

    if (!extension) {
      throw new NotFoundException('Extension request not found');
    }

    if (extension.status !== 'REQUESTED' && extension.status !== 'PENDING') {
      throw new BadRequestException('Extension has already been processed');
    }

    if (extension.rentalOrder.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can approve extension requests');
    }

    // Re-validate availability for the extension window
    const isAvailable = await this.repository.checkAvailability(
      extension.rentalOrder.listingId,
      extension.rentalOrder.endDate,
      extension.newEndDate,
      extension.rentalOrderId,
    );

    if (!isAvailable) {
      throw new BadRequestException('Dates for this extension are no longer available');
    }

    // Update rental order end date & total amount, reset any overdue penalty since extension was agreed
    const updatedTotal = Number(extension.rentalOrder.totalAmount) + Number(extension.additionalCost);
    const updatedDays =
      (extension.rentalOrder.rentalDurationDays || 0) + extension.additionalDays;

    await this.repository.update(extension.rentalOrderId, {
      endDate: extension.newEndDate,
      totalAmount: updatedTotal,
      rentalDurationDays: updatedDays,
      penaltyFee: 0,
      penaltyDays: 0,
      penaltyPaid: false,
      penaltyPaidAt: null,
      penaltyNotes: null,
    });

    // Update extension status
    const updated = await this.repository.updateExtension(extensionId, {
      status: 'APPROVED',
      approvedByUser: { connect: { id: user.id } },
      approvedAt: new Date(),
    });

    try {
      await this.repository.createHistory({
        rentalOrderId: extension.rentalOrderId,
        actorId: user.id,
        action: 'EXTENSION_ACCEPTED',
        metadata: {
          newEndDate: extension.newEndDate.toISOString(),
          additionalDays: extension.additionalDays,
          additionalCost: extension.additionalCost,
        },
      });
    } catch {
      // non-fatal
    }

    // Notify renter
    try {
      await this.notificationsService.createCustomNotification(
        extension.rentalOrder.renterId,
        'rental_status_changed',
        'Rental Extension Approved',
        `Your rental extension for "${extension.rentalOrder.listing.title}" until ${formatDateString(extension.newEndDate)} was approved!`,
        { rentalOrderId: extension.rentalOrderId },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  async declineExtension(extensionId: string, reason: string | undefined, user: AuthenticatedUser) {
    const extension = await this.prisma.rentalExtension.findUnique({
      where: { id: extensionId },
      include: { rentalOrder: { include: { listing: true } } },
    });

    if (!extension) {
      throw new NotFoundException('Extension request not found');
    }

    if (extension.rentalOrder.sellerId !== user.id) {
      throw new ForbiddenException('Only the seller can decline extension requests');
    }

    const updated = await this.repository.updateExtension(extensionId, {
      status: 'DECLINED',
      rejectionReason: reason || 'Declined by seller',
    });

    try {
      await this.repository.createHistory({
        rentalOrderId: extension.rentalOrderId,
        actorId: user.id,
        action: 'EXTENSION_DECLINED',
        notes: reason || null,
      });
    } catch {
      // non-fatal
    }

    // Notify renter
    try {
      await this.notificationsService.createCustomNotification(
        extension.rentalOrder.renterId,
        'rental_status_changed',
        'Rental Extension Declined',
        `Your extension request for "${extension.rentalOrder.listing.title}" was declined: ${reason || 'Dates unavailable'}`,
        { rentalOrderId: extension.rentalOrderId },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  async update(id: string, dto: UpdateRentalOrderDto, user: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    const data: Prisma.RentalOrderUpdateInput = {
      ...(dto.status ? { status: dto.status as any } : {}),
      ...(dto.handoverAt ? { handoverAt: new Date(dto.handoverAt) } : {}),
      ...(dto.returnedAt ? { returnedAt: new Date(dto.returnedAt) } : {}),
      ...(dto.actualReturnDate ? { actualReturnDate: new Date(dto.actualReturnDate) } : {}),
      ...(dto.preHandoverCondition !== undefined
        ? { preHandoverCondition: dto.preHandoverCondition }
        : {}),
      ...(dto.preHandoverPhotos !== undefined ? { preHandoverPhotos: dto.preHandoverPhotos } : {}),
      ...(dto.postReturnCondition !== undefined
        ? { postReturnCondition: dto.postReturnCondition }
        : {}),
      ...(dto.postReturnPhotos !== undefined ? { postReturnPhotos: dto.postReturnPhotos } : {}),
      ...(dto.damageNotes !== undefined ? { damageNotes: dto.damageNotes } : {}),
      ...(dto.damageCost !== undefined ? { damageCost: dto.damageCost } : {}),
      ...(dto.depositRefunded !== undefined ? { depositRefunded: dto.depositRefunded } : {}),
      ...(dto.depositRefundAmount !== undefined
        ? { depositRefundAmount: dto.depositRefundAmount }
        : {}),
      ...(dto.depositRefundReason !== undefined
        ? { depositRefundReason: dto.depositRefundReason }
        : {}),
    };

    const updated = await this.repository.update(id, data);

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'update_rental_order',
        resource: 'rental_order',
        resourceId: id,
        metadata: { status: dto.status },
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  async getUserRentals(userId: string, role: 'renter' | 'seller', status?: string) {
    const rentals = await this.repository.findByUser(userId, role, status);
    const processed = await Promise.all(rentals.map((r) => this.processRentalOverdue(r)));
    return {
      success: true,
      data: processed,
    };
  }

  // Condition Log methods
  async createConditionLog(bookingId: string, dto: CreateConditionLogDto, user: AuthenticatedUser) {
    const booking = await this.repository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Rental booking not found');
    }

    if (booking.renterId !== user.id && booking.sellerId !== user.id) {
      throw new BadRequestException('Only the renter or seller can create condition logs');
    }

    const data = {
      booking: { connect: { id: bookingId } },
      type: dto.type as any,
      photoUrls: dto.photoUrls,
      notes: dto.notes,
      loggedByUser: { connect: { id: user.id } },
    };

    const created = await this.repository.createConditionLog(data);
    return {
      success: true,
      data: created,
    };
  }

  async getConditionLogs(bookingId: string) {
    const logs = await this.repository.findConditionLogsByBooking(bookingId);
    return {
      success: true,
      data: logs,
    };
  }

  // Blackout Date methods
  async createBlackoutDate(dto: CreateBlackoutDateDto, user: AuthenticatedUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { sellerId: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== user.id) {
      throw new BadRequestException('Only the seller can create blackout dates');
    }

    const startDate = parseCalendarDate(dto.startDate, false);
    const endDate = parseCalendarDate(dto.endDate, true);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const data = {
      listing: { connect: { id: dto.listingId } },
      startDate,
      endDate,
      reason: dto.reason,
      createdByUser: { connect: { id: user.id } },
    };

    const created = await this.repository.createBlackoutDate(data);
    return {
      success: true,
      data: created,
    };
  }

  async getBlackoutDates(listingId: string) {
    const dates = await this.repository.findBlackoutDatesByListing(listingId);
    return {
      success: true,
      data: dates,
    };
  }

  async deleteBlackoutDate(id: string, user: AuthenticatedUser) {
    const result = await this.repository.deleteBlackoutDate(id, user.id);
    if (result.count === 0) {
      throw new NotFoundException(
        'Blackout date not found or you do not have permission to delete it',
      );
    }
    return {
      success: true,
      message: 'Blackout date deleted successfully',
    };
  }

  // Dispute handling
  async flagAsDisputed(
    id: string,
    reason: string,
    evidencePhotos: string[],
    user: AuthenticatedUser,
  ) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rental order not found');
    }

    if (existing.renterId !== user.id && existing.sellerId !== user.id) {
      throw new BadRequestException('Only the renter or seller can flag a rental as disputed');
    }

    if (existing.status === 'DISPUTED') {
      throw new BadRequestException('This rental is already flagged as disputed');
    }

    const updated = await this.repository.update(id, {
      status: 'DISPUTED',
      cancellationReason: reason,
      postReturnPhotos: evidencePhotos,
    });

    try {
      await this.repository.createHistory({
        rentalOrderId: id,
        actorId: user.id,
        action: 'DISPUTED',
        fromStatus: existing.status,
        toStatus: 'DISPUTED',
        notes: reason,
      });
    } catch {
      // non-fatal
    }

    try {
      await this.notificationsService.createCustomNotification(
        user.id,
        'rental_status_changed',
        'Rental Dispute Flagged',
        `A rental dispute has been flagged for "${existing.listing.title}". Our team will review the details.`,
        { rentalOrderId: id, reason },
      );
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Ensures that both the renter and seller are notified when a rental is overdue,
   * tracking the days overdue and penalty fee without duplicate notifications for the same day.
   */
  private async ensureOverdueNotificationDispatched(
    rental: any,
    overdueDays: number,
    penaltyFee: number,
    dailyLateRate: number,
  ): Promise<void> {
    try {
      // Find latest overdue notification sent to renter for this rental order
      const existingNotif = await this.prisma.notification.findFirst({
        where: {
          userId: rental.renterId,
          type: 'rental_status_changed',
          title: { contains: 'Rental Overdue' },
        },
        orderBy: { createdAt: 'desc' },
      });

      // If notification was already sent with the same overdue days, skip sending duplicate
      if (existingNotif && existingNotif.data && typeof existingNotif.data === 'object') {
        const notifData = existingNotif.data as Record<string, any>;
        if (notifData.rentalOrderId === rental.id && notifData.daysOverdue === overdueDays) {
          return;
        }
      }

      // Update DB record with latest penalty fee and days
      await this.prisma.rentalOrder.update({
        where: { id: rental.id },
        data: {
          penaltyFee,
          penaltyDays: overdueDays,
        },
      });

      // Dispatch to renter (lessee)
      await this.notificationsService.createCustomNotification(
        rental.renterId,
        'rental_status_changed',
        'Rental Overdue — Penalty Fee Accruing',
        `Your rental #${rental.orderNumber} ("${rental.listing.title}") is overdue by ${overdueDays} day(s). Late penalty fee accrued: ${penaltyFee.toLocaleString()} ETB (${overdueDays}d × ${dailyLateRate.toLocaleString()} ETB/day). Please return the item immediately.`,
        {
          rentalOrderId: rental.id,
          orderNumber: rental.orderNumber,
          daysOverdue: overdueDays,
          penaltyFee,
          dailyLateRate,
          listingId: rental.listingId,
          isOverdue: true,
        },
      );

      // Dispatch to seller (lender)
      await this.notificationsService.createCustomNotification(
        rental.sellerId,
        'rental_status_changed',
        'Rental Overdue Notice',
        `Rental #${rental.orderNumber} ("${rental.listing.title}") is overdue by ${overdueDays} day(s). Accrued penalty fee: ${penaltyFee.toLocaleString()} ETB (${overdueDays}d × ${dailyLateRate.toLocaleString()} ETB/day). Contact renter to coordinate return.`,
        {
          rentalOrderId: rental.id,
          orderNumber: rental.orderNumber,
          daysOverdue: overdueDays,
          penaltyFee,
          dailyLateRate,
          listingId: rental.listingId,
          isOverdue: true,
        },
      );

      this.logger.log(`Overdue notifications dispatched for rental ${rental.orderNumber}: ${overdueDays}d overdue, ${penaltyFee} ETB`);
    } catch (err) {
      this.logger.error(`Failed to ensure overdue notifications for rental ${rental.id}: ${(err as Error).message}`);
    }
  }

  /**
   * Calculates overdue days, penalty fee, and ensures notifications are dispatched.
   */
  private async processRentalOverdue(rental: any): Promise<any> {
    if (!rental) return rental;

    // Calculate rental duration if missing
    if (!rental.rentalDurationDays && rental.startDate && rental.endDate) {
      const s = new Date(rental.startDate).getTime();
      const e = new Date(rental.endDate).getTime();
      rental.rentalDurationDays = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    }

    const isReturnableState =
      rental.status === 'ACTIVE' ||
      rental.status === 'RETURN_PENDING' ||
      rental.status === 'RETURN_INITIATED';

    const now = new Date();
    const endDate = new Date(rental.endDate);
    const isOverdue = isReturnableState && endDate.getTime() < now.getTime();

    const dailyLateRate = Number(
      (rental.listing as any)?.attributes?.lateFeePerDay ??
      rental.dailyRate ??
      (rental.listing?.rentalPricePerDay ? Number(rental.listing.rentalPricePerDay) : 0)
    );

    if (isOverdue) {
      const overdueDays = Math.max(1, Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)));
      const penaltyFee = overdueDays * dailyLateRate;

      rental.isOverdue = true;
      rental.overdueDays = overdueDays;
      rental.penaltyFee = penaltyFee;
      rental.dailyLateRate = dailyLateRate;

      // Ensure notifications are dispatched to both parties
      await this.ensureOverdueNotificationDispatched(rental, overdueDays, penaltyFee, dailyLateRate);
    } else {
      rental.isOverdue = false;
      rental.overdueDays = rental.penaltyDays ?? 0;
      rental.penaltyFee = rental.penaltyFee ?? 0;
      rental.dailyLateRate = dailyLateRate;
    }

    return rental;
  }
}

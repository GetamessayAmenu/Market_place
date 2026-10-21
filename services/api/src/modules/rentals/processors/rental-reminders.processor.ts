import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { QUEUE_NAMES } from '../../../infrastructure/queue/queue.constants';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface RentalReminderJobData {
  type: 'pre_return' | 'overdue' | 'return_initiated';
  rentalOrderId: string;
  renterId: string;
  sellerId: string;
  endDate: string;
  hoursUntil?: number;
  daysOverdue?: number;
}

@Processor(QUEUE_NAMES.RENTAL_REMINDERS)
export class RentalRemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RentalRemindersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<RentalReminderJobData>): Promise<void> {
    this.logger.log(`Processing rental reminder job ${String(job.id)}: ${job.data.type} for rental ${job.data.rentalOrderId}`);

    try {
      switch (job.data.type) {
        case 'pre_return':
          await this.handlePreReturnReminder(job.data);
          break;
        case 'overdue':
          await this.handleOverdueReminder(job.data);
          break;
        case 'return_initiated':
          await this.handleReturnInitiated(job.data);
          break;
        default:
          this.logger.warn(`Unknown rental reminder job type: ${String(job.data.type)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process rental reminder job: ${(error as Error).message}`);
      throw error;
    }
  }

  private async handlePreReturnReminder(data: RentalReminderJobData): Promise<void> {
    const rental = await this.prisma.rentalOrder.findUnique({
      where: { id: data.rentalOrderId },
      select: { status: true, endDate: true },
    });

    if (!rental) {
      this.logger.warn(`Rental ${data.rentalOrderId} not found for pre-return reminder`);
      return;
    }

    if (rental.status !== 'ACTIVE') {
      this.logger.log(`Rental ${data.rentalOrderId} is not active, skipping pre-return reminder`);
      return;
    }

    // Notify renter about upcoming return
    await this.notificationsService.createCustomNotification(
      data.renterId,
      'rental_pre_return',
      'Rental Return Reminder',
      'Your rental period is ending soon. Please arrange for return.',
      { rentalOrderId: data.rentalOrderId },
    );

    // Notify seller about upcoming return
    await this.notificationsService.createCustomNotification(
      data.sellerId,
      'rental_pre_return_seller',
      'Rental Return Reminder',
      'A rental period is ending soon. Prepare for item return.',
      { rentalOrderId: data.rentalOrderId },
    );

    this.logger.log(`Pre-return reminder sent for rental ${data.rentalOrderId}`);
  }

  private async handleOverdueReminder(data: RentalReminderJobData): Promise<void> {
    const rental = await this.prisma.rentalOrder.findUnique({
      where: { id: data.rentalOrderId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            rentalPricePerDay: true,
            attributes: true,
          },
        },
      },
    });

    if (!rental) {
      this.logger.warn(`Rental ${data.rentalOrderId} not found for overdue reminder`);
      return;
    }

    if (rental.status !== 'ACTIVE' && rental.status !== 'RETURN_PENDING' && rental.status !== 'RETURN_INITIATED') {
      this.logger.log(`Rental ${data.rentalOrderId} is not in an active returnable state, skipping overdue reminder`);
      return;
    }

    const now = new Date();
    const overdueDays = Math.max(1, Math.ceil((now.getTime() - rental.endDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyLateRate = Number(
      (rental.listing?.attributes as any)?.lateFeePerDay ??
      rental.dailyRate ??
      (rental.listing?.rentalPricePerDay ? Number(rental.listing.rentalPricePerDay) : 0)
    );
    const penaltyFee = overdueDays * dailyLateRate;

    // Update rental with latest calculated penalty
    await this.prisma.rentalOrder.update({
      where: { id: data.rentalOrderId },
      data: {
        penaltyFee,
        penaltyDays: overdueDays,
      },
    });

    // Notify renter (lessee) about overdue item and accrued penalty fee
    await this.notificationsService.createCustomNotification(
      data.renterId,
      'rental_status_changed',
      'Rental Overdue — Penalty Fee Accruing',
      `Your rental #${rental.orderNumber} ("${rental.listing.title}") is overdue by ${overdueDays} day(s). Late penalty fee accrued: ${penaltyFee.toLocaleString()} ETB (${overdueDays}d × ${dailyLateRate.toLocaleString()} ETB/day). Please return the item immediately.`,
      {
        rentalOrderId: data.rentalOrderId,
        orderNumber: rental.orderNumber,
        daysOverdue: overdueDays,
        penaltyFee,
        dailyLateRate,
        listingId: rental.listingId,
        isOverdue: true,
      },
    );

    // Notify seller (lender) about overdue item and penalty fee
    await this.notificationsService.createCustomNotification(
      data.sellerId,
      'rental_status_changed',
      'Rental Overdue Notice',
      `Rental #${rental.orderNumber} ("${rental.listing.title}") is overdue by ${overdueDays} day(s). Accrued penalty fee: ${penaltyFee.toLocaleString()} ETB (${overdueDays}d × ${dailyLateRate.toLocaleString()} ETB/day). Contact renter to coordinate return.`,
      {
        rentalOrderId: data.rentalOrderId,
        orderNumber: rental.orderNumber,
        daysOverdue: overdueDays,
        penaltyFee,
        dailyLateRate,
        listingId: rental.listingId,
        isOverdue: true,
      },
    );

    this.logger.log(`Overdue reminder sent with penalty ${penaltyFee} ETB for rental ${data.rentalOrderId}`);
  }

  private async handleReturnInitiated(data: RentalReminderJobData): Promise<void> {
    // Notify seller that renter has initiated return
    await this.notificationsService.createCustomNotification(
      data.sellerId,
      'rental_return_initiated',
      'Return Initiated',
      'The renter has initiated the return process',
      { rentalOrderId: data.rentalOrderId },
    );

    this.logger.log(`Return initiated notification sent for rental ${data.rentalOrderId}`);
  }
}

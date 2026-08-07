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
      select: { status: true, endDate: true },
    });

    if (!rental) {
      this.logger.warn(`Rental ${data.rentalOrderId} not found for overdue reminder`);
      return;
    }

    if (rental.status !== 'ACTIVE') {
      this.logger.log(`Rental ${data.rentalOrderId} is not active, skipping overdue reminder`);
      return;
    }

    // Update rental status to indicate overdue
    await this.prisma.rentalOrder.update({
      where: { id: data.rentalOrderId },
      data: { status: 'RETURN_INITIATED' },
    });

    // Notify renter about overdue item
    await this.notificationsService.createCustomNotification(
      data.renterId,
      'rental_overdue',
      'Rental Overdue',
      'Your rental is overdue. Please return the item immediately.',
      { rentalOrderId: data.rentalOrderId },
    );

    // Notify seller about overdue item
    await this.notificationsService.createCustomNotification(
      data.sellerId,
      'rental_overdue_seller',
      'Rental Overdue',
      'A rental is overdue. Contact the renter for return.',
      { rentalOrderId: data.rentalOrderId },
    );

    this.logger.log(`Overdue reminder sent and status updated for rental ${data.rentalOrderId}`);
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

import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { QUEUE_NAMES } from '../../../infrastructure/queue/queue.constants';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface RentalExpirationJobData {
  rentalOrderId: string;
  renterId: string;
  sellerId: string;
  listingId: string;
}

@Processor(QUEUE_NAMES.RENTAL_EXPIRATION)
export class RentalExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(RentalExpirationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<RentalExpirationJobData>): Promise<void> {
    this.logger.log(`Processing rental expiration job ${String(job.id)} for rental ${job.data.rentalOrderId}`);

    try {
      const rental = await this.prisma.rentalOrder.findUnique({
        where: { id: job.data.rentalOrderId },
        select: { status: true },
      });

      if (!rental) {
        this.logger.warn(`Rental ${job.data.rentalOrderId} not found for expiration`);
        return;
      }

      // Only expire if still in REQUESTED status
      if (rental.status !== 'REQUESTED') {
        this.logger.log(`Rental ${job.data.rentalOrderId} is not in REQUESTED status, skipping expiration`);
        return;
      }

      // Update rental status to EXPIRED
      await this.prisma.rentalOrder.update({
        where: { id: job.data.rentalOrderId },
        data: { 
          status: 'EXPIRED',
          cancellationReason: 'Auto-expired after 24 hours without seller response',
        },
      });

      // Notify renter that their request has expired
      await this.notificationsService.createCustomNotification(
        job.data.renterId,
        'rental_request_expired',
        'Rental Request Expired',
        'Your rental request has expired due to no seller response',
        { rentalOrderId: job.data.rentalOrderId },
      );

      // Notify seller about expired request
      await this.notificationsService.createCustomNotification(
        job.data.sellerId,
        'rental_request_expired_seller',
        'Rental Request Expired',
        'A rental request has expired due to no response',
        { rentalOrderId: job.data.rentalOrderId },
      );

      this.logger.log(`Rental ${job.data.rentalOrderId} marked as EXPIRED and notifications sent`);
    } catch (error) {
      this.logger.error(`Failed to process rental expiration job: ${(error as Error).message}`);
      throw error;
    }
  }
}

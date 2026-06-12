import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { QUEUE_NAMES } from '../../../infrastructure/queue/queue.constants';

export interface NotificationJobData {
  type: 'message_received' | 'listing_approved' | 'listing_rejected' | 'listing_favorited' | 'seller_verified';
  recipientId: string;
  data: Record<string, unknown>;
}

@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.log(`Processing notification job ${String(job.id)}: ${job.data.type}`);

    try {
      switch (job.data.type) {
        case 'message_received':
          await this.handleMessageReceived(job.data);
          break;
        case 'listing_approved':
          await this.handleListingApproved(job.data);
          break;
        case 'listing_rejected':
          await this.handleListingRejected(job.data);
          break;
        case 'listing_favorited':
          await this.handleListingFavorited(job.data);
          break;
        case 'seller_verified':
          await this.handleSellerVerified(job.data);
          break;
        default:
          this.logger.warn(`Unknown notification job type: ${String(job.data.type)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process notification job: ${(error as Error).message}`);
      throw error;
    }
  }

  private async handleMessageReceived(data: NotificationJobData): Promise<void> {
    // Message notifications are created in real-time via NotificationsService
    // This processor is for fallback/retry processing if needed
    this.logger.log(`Message received notification for user ${data.recipientId}`);
  }

  private async handleListingApproved(data: NotificationJobData): Promise<void> {
    // Listing approved notifications are created in real-time via NotificationsService
    this.logger.log(`Listing approved notification for user ${data.recipientId}`);
  }

  private async handleListingRejected(data: NotificationJobData): Promise<void> {
    // Listing rejected notifications are created in real-time via NotificationsService
    this.logger.log(`Listing rejected notification for user ${data.recipientId}`);
  }

  private async handleListingFavorited(data: NotificationJobData): Promise<void> {
    // Listing favorited notifications are created in real-time via NotificationsService
    this.logger.log(`Listing favorited notification for user ${data.recipientId}`);
  }

  private async handleSellerVerified(data: NotificationJobData): Promise<void> {
    // Seller verified notifications are created in real-time via NotificationsService
    this.logger.log(`Seller verified notification for user ${data.recipientId}`);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import { QUEUE_NAMES } from '../../../infrastructure/queue/queue.constants';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BroadcastsRepository } from '../broadcasts.repository';
import { NotificationsRepository } from '../notifications.repository';

export interface BroadcastJobData {
  broadcastId: string;
}

@Processor(QUEUE_NAMES.NOTIFICATIONS)
@Injectable()
export class BroadcastQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(BroadcastQueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly broadcastsRepository: BroadcastsRepository,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<BroadcastJobData>): Promise<void> {
    if (job.name !== 'process_broadcast') {
      return;
    }

    const { broadcastId } = job.data;
    this.logger.log(`Processing broadcast job ${String(job.id)} for broadcast ${broadcastId}`);
    await this.executeBroadcastDelivery(broadcastId);
  }

  async executeBroadcastDelivery(broadcastId: string): Promise<void> {
    const broadcast = await this.broadcastsRepository.findBroadcastById(broadcastId);
    if (!broadcast) {
      this.logger.warn(`Broadcast ${broadcastId} not found. Skipping execution.`);
      return;
    }

    if (broadcast.status === 'CANCELLED' || broadcast.status === 'SENT') {
      this.logger.log(`Broadcast ${broadcastId} status is already ${broadcast.status}. Skipping.`);
      return;
    }

    await this.broadcastsRepository.updateBroadcast(broadcastId, {
      status: 'PROCESSING',
    });

    try {
      let userWhere: Prisma.UserWhereInput = {
        deletedAt: null,
      };

      if (broadcast.audience === 'SELLERS') {
        userWhere = {
          ...userWhere,
          OR: [
            { sellerType: { not: null } },
            { role: { slug: { in: ['seller', 'designer', 'tailor', 'boutique', 'rental_shop'] } } },
          ],
        };
      } else if (broadcast.audience === 'BUYERS') {
        userWhere = {
          ...userWhere,
          sellerType: null,
          role: { slug: { notIn: ['admin', 'super_admin', 'moderator'] } },
        };
      }

      const users = await this.prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          notificationPreference: {
            select: { promotional: true },
          },
        },
      });

      const targetUserIds = users
        .filter((u) => u.notificationPreference?.promotional !== false)
        .map((u) => u.id);

      const totalRecipients = targetUserIds.length;
      let deliveredCount = 0;
      let failedCount = 0;

      const chunkSize = 250;
      for (let i = 0; i < targetUserIds.length; i += chunkSize) {
        const chunk = targetUserIds.slice(i, i + chunkSize);

        await Promise.all(
          chunk.map(async (userId) => {
            try {
              const notification = await this.notificationsRepository.create({
                user: { connect: { id: userId } },
                type: 'system_announcement',
                title: broadcast.title,
                body: broadcast.message,
                data: {
                  broadcastId: broadcast.id,
                  imageUrl: broadcast.imageUrl,
                  actionUrl: broadcast.actionUrl,
                  actionLabel: broadcast.actionLabel,
                },
              });

              await this.prisma.broadcastRecipient.create({
                data: {
                  broadcastId: broadcast.id,
                  userId,
                  notificationId: notification.id,
                  status: 'DELIVERED',
                },
              });

              deliveredCount++;

              const unreadCount = await this.notificationsRepository.countUnread(userId);

              this.eventEmitter.emit('realtime.notification', {
                userId,
                notification: {
                  id: notification.id,
                  type: notification.type,
                  title: notification.title,
                  body: notification.body,
                  data: notification.data as Record<string, unknown> | null,
                  readAt: notification.readAt,
                  createdAt: notification.createdAt,
                  isRead: false,
                },
                unreadCount,
              });
            } catch (err) {
              failedCount++;
              this.logger.error(`Failed delivery to user ${userId}: ${(err as Error).message}`);
            }
          }),
        );
      }

      await this.broadcastsRepository.updateBroadcast(broadcastId, {
        status: 'SENT',
        sentAt: new Date(),
        totalRecipients,
        deliveredCount,
        failedCount,
      });

      this.logger.log(
        `Broadcast ${broadcastId} completed successfully. Total: ${totalRecipients}, Delivered: ${deliveredCount}, Failed: ${failedCount}`,
      );
    } catch (error) {
      this.logger.error(`Broadcast ${broadcastId} execution failed: ${(error as Error).message}`);
      await this.broadcastsRepository.updateBroadcast(broadcastId, {
        status: 'FAILED',
      });
      throw error;
    }
  }
}

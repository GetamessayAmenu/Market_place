import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import type { NotificationChannel, NotificationPayload } from './channel.interface';
import { NotificationsRepository } from '../notifications.repository';

@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly name = 'in_app';
  private readonly logger = new Logger(InAppChannel.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    try {
      const createInput: Prisma.NotificationCreateInput = {
        user: { connect: { id: payload.userId } },
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
      };

      if (payload.data) {
        createInput.data = payload.data as Prisma.InputJsonValue;
      }

      const notification = await this.notificationsRepository.create(createInput);

      const unreadCount = await this.notificationsRepository.countUnread(payload.userId);

      // Emit domain event for realtime gateway Socket.IO delivery
      this.eventEmitter.emit('realtime.notification', {
        userId: payload.userId,
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
    } catch (error) {
      this.logger.error(`Failed to deliver in-app notification to user ${payload.userId}: ${(error as Error).message}`);
      throw error;
    }
  }
}

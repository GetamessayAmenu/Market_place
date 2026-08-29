import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class RealtimeNotificationListener implements OnModuleInit {
  private readonly logger = new Logger(RealtimeNotificationListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  onModuleInit(): void {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventEmitter.on(
      'realtime.notification',
      (payload: {
        userId: string;
        notification: {
          id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Record<string, unknown> | null;
          readAt?: Date | null;
          createdAt?: Date;
          isRead?: boolean;
        };
        unreadCount?: number;
      }) => {
        try {
          this.notificationsGateway.sendNotificationToUser(payload.userId, payload.notification);
          if (typeof payload.unreadCount === 'number') {
            this.notificationsGateway.sendUnreadCountToUser(payload.userId, payload.unreadCount);
          }
          this.logger.log(`Pushed realtime notification to user ${payload.userId}`);
        } catch (error) {
          this.logger.error(
            `Failed to process realtime notification event: ${(error as Error).message}`,
          );
        }
      },
    );
  }
}

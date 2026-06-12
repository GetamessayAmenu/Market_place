import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { NOTIFICATIONS_SERVER_EVENTS } from '../events.constants';
import { SocketAuthService } from '../websocket/socket-auth.service';
import { SocketAuthMiddleware } from '../websocket/socket-auth.middleware';

/**
 * Notifications Gateway — handles real-time delivery of notifications to connected users.
 * Broadcasts notification events via Socket.IO to user-specific rooms.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly socketAuthMiddleware: SocketAuthMiddleware,
  ) {}

  afterInit(server: Server): void {
    server.use(this.socketAuthMiddleware.use);
    this.logger.log('Notifications gateway initialized');
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const user = this.socketAuth.getSocketUser(socket);
      // User joins their own notification room
      const userRoom = `user:${user.id}`;
      await socket.join(userRoom);
      this.logger.log(`User ${user.id} joined notifications room`);
    } catch (error) {
      this.logger.warn(`Connection rejected: ${(error as Error).message}`);
      socket.disconnect(true);
    }
  }

  async handleDisconnect(_socket: Socket): Promise<void> {
    this.logger.log('Notifications gateway client disconnected');
  }

  /**
   * Broadcast a notification to a specific user
   * This method can be called from services to send real-time notifications
   */
  sendNotificationToUser(
    userId: string,
    notification: {
      type: string;
      title: string;
      body?: string | null;
      data?: Record<string, unknown> | null;
      isRead?: boolean;
    },
  ): void {
    try {
      const userRoom = `user:${userId}`;
      this.server.to(userRoom).emit(NOTIFICATIONS_SERVER_EVENTS.NEW_NOTIFICATION, {
        ...notification,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Broadcast unread count to a specific user
   */
  sendUnreadCountToUser(userId: string, unreadCount: number): void {
    try {
      const userRoom = `user:${userId}`;
      this.server.to(userRoom).emit(NOTIFICATIONS_SERVER_EVENTS.UNREAD_COUNT, {
        unreadCount,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send unread count to user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Broadcast read receipt to a specific user
   */
  sendReadReceiptToUser(userId: string, notificationId: string): void {
    try {
      const userRoom = `user:${userId}`;
      this.server.to(userRoom).emit(NOTIFICATIONS_SERVER_EVENTS.NOTIFICATION_READ, {
        notificationId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send read receipt to user ${userId}: ${(error as Error).message}`,
      );
    }
  }
}

import type { NotificationType } from '@prisma/client';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
}

export interface NotificationChannel {
  name: string;
  send(payload: NotificationPayload): Promise<void>;
}

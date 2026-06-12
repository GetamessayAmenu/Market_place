import type { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  id!: string;

  type!: NotificationType;

  title!: string;

  body!: string | null;

  data!: Record<string, unknown> | null;

  readAt!: Date | null;

  createdAt!: Date;

  isRead!: boolean;
}

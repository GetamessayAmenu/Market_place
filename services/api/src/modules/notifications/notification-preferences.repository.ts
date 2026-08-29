import { Injectable } from '@nestjs/common';
import type { NotificationPreference, Prisma } from '@prisma/client';
import { BaseRepository, type PrismaModelDelegate } from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class NotificationPreferencesRepository extends BaseRepository<NotificationPreference> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.notificationPreference as unknown as PrismaModelDelegate);
  }

  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    return this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  async getOrCreateDefault(userId: string): Promise<NotificationPreference> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }
    return this.prisma.notificationPreference.create({
      data: {
        userId,
        chat: true,
        listing: true,
        order: true,
        rental: true,
        customOrder: true,
        promotional: true,
      },
    });
  }

  async updatePreferences(
    userId: string,
    data: Prisma.NotificationPreferenceUpdateInput,
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        chat: (data.chat as boolean) ?? true,
        listing: (data.listing as boolean) ?? true,
        order: (data.order as boolean) ?? true,
        rental: (data.rental as boolean) ?? true,
        customOrder: (data.customOrder as boolean) ?? true,
        promotional: (data.promotional as boolean) ?? true,
      },
      update: data,
    });
  }
}

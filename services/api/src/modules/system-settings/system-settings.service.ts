import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { SecurityEventsService } from '../security-events/security-events.service';

@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminLogsService: AdminLogsService,
    private readonly securityEventsService: SecurityEventsService,
  ) {}

  /**
   * Retrieve platform settings, optionally filtered by group.
   */
  async getSettings(group?: string) {
    const where: Prisma.SystemSettingWhereInput = group ? { group } : {};
    const settings = await this.prisma.systemSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
      include: {
        updatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return settings.map((s) => ({
      id: s.id,
      key: s.key,
      value: s.value,
      group: s.group,
      description: s.description,
      isPublic: s.isPublic,
      updatedAt: s.updatedAt,
      updatedBy: s.updatedBy,
    }));
  }

  /**
   * Update a platform setting value and audit the modification.
   */
  async updateSetting(
    currentUser: AuthenticatedUser,
    key: string,
    value: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    if (!existing) {
      throw new NotFoundException(`Setting with key '${key}' not found.`);
    }

    const previousValue = existing.value;
    const jsonValue =
      typeof value === 'string'
        ? (() => {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          })()
        : value;

    const updated = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        value: jsonValue as Prisma.InputJsonValue,
        updatedById: currentUser.id,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'SYSTEM_SETTING_UPDATED',
      resource: 'setting',
      resourceId: existing.id,
      metadata: {
        key,
        previousValue: previousValue as Record<string, unknown>,
        newValue: jsonValue,
      },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'SYSTEM_SETTING_CHANGED',
      severity: existing.group === 'security' ? 'WARNING' : 'INFO',
      actorId: currentUser.id,
      ipAddress,
      userAgent,
      details: {
        key,
        previousValue: previousValue as Record<string, unknown>,
        newValue: jsonValue,
      },
      status: 'SUCCESS',
    });

    return {
      id: updated.id,
      key: updated.key,
      value: updated.value,
      group: updated.group,
      description: updated.description,
      isPublic: updated.isPublic,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy,
    };
  }

  /**
   * Retrieve all feature flags.
   */
  async getFeatureFlags() {
    const flags = await this.prisma.systemSetting.findMany({
      where: {
        OR: [
          { group: 'feature_flags' },
          { group: 'marketplace' },
          { key: { startsWith: 'feature.' } },
          { key: { endsWith: '_enabled' } },
        ],
      },
      orderBy: { key: 'asc' },
      include: {
        updatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return flags.map((f) => {
      let isEnabled = false;
      if (typeof f.value === 'boolean') {
        isEnabled = f.value;
      } else if (
        typeof f.value === 'object' &&
        f.value !== null &&
        'enabled' in (f.value as any)
      ) {
        isEnabled = Boolean((f.value as any).enabled);
      } else if (typeof f.value === 'string') {
        isEnabled = f.value === 'true' || f.value === '1';
      }

      return {
        id: f.id,
        key: f.key,
        name: f.key.replace(/^feature\./, '').replace(/_/g, ' ').toUpperCase(),
        enabled: isEnabled,
        group: f.group,
        description: f.description,
        updatedAt: f.updatedAt,
        updatedBy: f.updatedBy,
      };
    });
  }

  /**
   * Toggle or update a feature flag.
   */
  async updateFeatureFlag(
    currentUser: AuthenticatedUser,
    key: string,
    enabled: boolean,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const flagKey = key;

    const existing = await this.prisma.systemSetting.findFirst({
      where: {
        OR: [
          { key: flagKey },
          { key: `feature.${flagKey}` },
          { key: flagKey.replace(/^feature\./, '') },
        ],
      },
    });

    if (!existing) {
      throw new NotFoundException(`Feature flag '${flagKey}' not found.`);
    }

    const previousValue = existing.value;
    const newValue =
      typeof existing.value === 'object' &&
      existing.value !== null &&
      'enabled' in (existing.value as any)
        ? { ...(existing.value as any), enabled }
        : { enabled };

    const updated = await this.prisma.systemSetting.update({
      where: { id: existing.id },
      data: {
        value: newValue,
        updatedById: currentUser.id,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'FEATURE_FLAG_TOGGLED',
      resource: 'setting',
      resourceId: existing.id,
      metadata: {
        key: existing.key,
        enabled,
      },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'FEATURE_FLAG_TOGGLED',
      severity: 'WARNING',
      actorId: currentUser.id,
      ipAddress,
      userAgent,
      details: {
        key: existing.key,
        enabled,
        previousValue: previousValue as Record<string, unknown>,
      },
      status: 'SUCCESS',
    });

    return {
      id: updated.id,
      key: updated.key,
      name: updated.key.replace(/^feature\./, '').replace(/_/g, ' ').toUpperCase(),
      enabled,
      description: updated.description,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy,
    };
  }
}

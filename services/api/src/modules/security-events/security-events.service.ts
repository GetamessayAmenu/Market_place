import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import type { SecurityEventQueryDto } from './dto/security-event-query.dto';

export interface CreateSecurityEventInput {
  eventType: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL' | undefined;
  actorId?: string | null | undefined;
  targetUserId?: string | null | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  details?: Record<string, unknown> | null | undefined;
  status?: string | undefined;
}

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'mfacode',
  'mfasecret',
  'authorization',
]);

function sanitizeSecurityDetails(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeSecurityDetails);

  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key.toLowerCase().replace(/[-_]/g, ''))) {
      clean[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      clean[key] = sanitizeSecurityDetails(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

@Injectable()
export class SecurityEventsService {
  private readonly logger = new Logger(SecurityEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an immutable security event into the PostgreSQL security_events table.
   */
  async recordEvent(input: CreateSecurityEventInput) {
    try {
      const sanitizedDetails = input.details
        ? (sanitizeSecurityDetails(input.details) as Prisma.InputJsonValue)
        : Prisma.JsonNull;

      const record = await this.prisma.securityEvent.create({
        data: {
          eventType: input.eventType,
          severity: input.severity ?? 'INFO',
          actorId: input.actorId ?? null,
          targetUserId: input.targetUserId ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          details: sanitizedDetails,
          status: input.status ?? 'SUCCESS',
        },
      });

      return record;
    } catch (error) {
      // Security event creation must never crash parent transaction/operation
      this.logger.error('Failed to record security event:', error);
      return null;
    }
  }

  /**
   * Queries security events with filters, search, and pagination.
   */
  async findEvents(query: SecurityEventQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SecurityEventWhereInput = {
      ...(query.eventType ? { eventType: { equals: query.eventType, mode: 'insensitive' } } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.targetUserId ? { targetUserId: query.targetUserId } : {}),
      ...(query.status ? { status: { equals: query.status, mode: 'insensitive' } } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { eventType: { contains: query.search, mode: 'insensitive' } },
              { actor: { email: { contains: query.search, mode: 'insensitive' } } },
              { targetUser: { email: { contains: query.search, mode: 'insensitive' } } },
              { ipAddress: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              displayName: true,
              email: true,
              role: { select: { slug: true, name: true } },
            },
          },
          targetUser: {
            select: {
              id: true,
              displayName: true,
              email: true,
              role: { select: { slug: true, name: true } },
            },
          },
        },
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    return toPaginatedResponse({ items, total, page, limit });
  }

  /**
   * Get recent security overview metrics.
   */
  async getSecurityOverview() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [failedLogins24h, criticalEvents24h, totalRecentEvents, recentEvents] = await Promise.all([
      this.prisma.securityEvent.count({
        where: {
          eventType: 'ADMIN_LOGIN_FAILED',
          createdAt: { gte: oneDayAgo },
        },
      }),
      this.prisma.securityEvent.count({
        where: {
          severity: 'CRITICAL',
          createdAt: { gte: oneDayAgo },
        },
      }),
      this.prisma.securityEvent.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),
      this.prisma.securityEvent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, displayName: true, email: true } },
          targetUser: { select: { id: true, displayName: true, email: true } },
        },
      }),
    ]);

    return {
      failedLogins24h,
      criticalEvents24h,
      totalRecentEvents,
      recentEvents,
    };
  }
}

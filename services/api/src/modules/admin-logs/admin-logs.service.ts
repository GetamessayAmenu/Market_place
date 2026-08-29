import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';

import type { AdminLogQueryDto } from './dto/admin-log-query.dto';
import { sanitizeAuditPayload, computeChanges } from './utils/audit-sanitizer.util';

export interface CreateAuditLogInput {
  actorId: string;
  actorType?: string;
  action: string;
  resource: string;
  resourceType?: string;
  resourceId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  changes?: Record<string, { before: any; after: any }> | null;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: string;
}

@Injectable()
export class AdminLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an immutable Audit Log record to PostgreSQL. Server-side only.
   */
  async createLog(input: CreateAuditLogInput) {
    try {
      const resource = input.resourceType || input.resource;
      let changes = input.changes ? sanitizeAuditPayload(input.changes) : null;

      if (!changes && (input.beforeState || input.afterState)) {
        changes = computeChanges(input.beforeState, input.afterState);
      }

      const data: Record<string, any> = {
        actor: { connect: { id: input.actorId } },
        actorType: input.actorType ?? 'USER',
        action: input.action,
        resource,
        resourceId: input.resourceId ?? null,
        description: input.description ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        status: input.status ?? 'SUCCESS',
      };

      if (input.metadata !== undefined && input.metadata !== null) {
        data.metadata = sanitizeAuditPayload(input.metadata) as Prisma.InputJsonValue;
      }

      if (changes !== null && changes !== undefined) {
        data.changes = changes as Prisma.InputJsonValue;
      }

      return await this.prisma.adminLog.create({ data: data as Prisma.AdminLogCreateInput });
    } catch (error) {
      // Security logging fail-safe: log error to console without breaking parent caller
      console.error('AuditLog creation failed:', error);
      return null;
    }
  }

  /**
   * Queries paginated audit logs with search, filtering, and date range support.
   */
  async findLogs(query: AdminLogQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const resource = query.resourceType || query.resource;

    const where: Prisma.AdminLogWhereInput = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.actorType ? { actorType: { equals: query.actorType, mode: 'insensitive' } } : {}),
      ...(resource ? { resource: { equals: resource, mode: 'insensitive' } } : {}),
      ...(query.action ? { action: { equals: query.action, mode: 'insensitive' } } : {}),
      ...(query.resourceId ? { resourceId: query.resourceId } : {}),
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
              { action: { contains: query.search, mode: 'insensitive' } },
              { resource: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { actor: { email: { contains: query.search, mode: 'insensitive' } } },
              { actor: { displayName: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.adminLog.findMany({
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
              role: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.adminLog.count({ where }),
    ]);

    return toPaginatedResponse({ items, total, page, limit });
  }

  /**
   * Retrieves a single Audit Log detailed record by ID.
   */
  async findLogById(id: string) {
    const log = await this.prisma.adminLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: { select: { id: true, name: true, description: true } },
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found.`);
    }

    return log;
  }

  /**
   * Queries logs for a specific resource target.
   */
  async findByResource(resource: string, resourceId: string) {
    return this.prisma.adminLog.findMany({
      where: { resource, resourceId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  /**
   * Generates a CSV stream/string of filtered audit logs. Max limit capped at 1000 items.
   */
  async exportLogsCsv(query: AdminLogQueryDto): Promise<string> {
    const resource = query.resourceType || query.resource;

    const where: Prisma.AdminLogWhereInput = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(resource ? { resource: { equals: resource, mode: 'insensitive' } } : {}),
      ...(query.action ? { action: { equals: query.action, mode: 'insensitive' } } : {}),
      ...(query.status ? { status: { equals: query.status, mode: 'insensitive' } } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const logs = await this.prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        actor: { select: { id: true, displayName: true, email: true } },
      },
    });

    const headers = [
      'ID',
      'Timestamp',
      'Actor ID',
      'Actor Email',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'Description',
      'IP Address',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.actorId,
      log.actor?.email ?? '',
      log.action,
      log.resource,
      log.resourceId ?? '',
      log.status,
      log.description ? `"${log.description.replace(/"/g, '""')}"` : '',
      log.ipAddress ?? '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';

import type { AdminLogQueryDto } from './dto/admin-log-query.dto';

@Injectable()
export class AdminLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(input: {
    actorId: string;
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const data: any = {
      actorId: input.actorId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
    };
    if (input.metadata !== undefined && input.metadata !== null) data.metadata = input.metadata;
    if (input.ipAddress !== undefined && input.ipAddress !== null) data.ipAddress = input.ipAddress;
    if (input.userAgent !== undefined && input.userAgent !== null) data.userAgent = input.userAgent;

    return this.prisma.adminLog.create({ data });
  }

  async findLogs(query: AdminLogQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AdminLogWhereInput = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.resource ? { resource: query.resource } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.resourceId ? { resourceId: query.resourceId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
        skip,
        take: limit,
        include: {
          actor: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.prisma.adminLog.count({ where }),
    ]);

    return toPaginatedResponse({ items, total, page, limit });
  }

  async findByResource(resource: string, resourceId: string) {
    return this.prisma.adminLog.findMany({
      where: { resource, resourceId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, displayName: true, email: true } },
      },
    });
  }
}

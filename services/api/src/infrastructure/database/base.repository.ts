import type { Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service';

/**
 * Delegate shape for a Prisma model (e.g. prisma.user).
 */
export type PrismaModelDelegate = {
  findUnique: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<unknown[]>;
  count: (args: unknown) => Promise<number>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

export interface FindByIdOptions {
  readonly include?: Record<string, boolean | object>;
}

export interface PaginateParams {
  readonly page: number;
  readonly limit: number;
  readonly where?: Record<string, unknown>;
  readonly orderBy?: Record<string, Prisma.SortOrder>;
}

export interface PaginateResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * Base repository — domain repositories extend this in later phases.
 * Keeps Prisma access out of services/controllers.
 */
export abstract class BaseRepository<
  TEntity,
  TDelegate extends PrismaModelDelegate = PrismaModelDelegate,
> {
  protected constructor(
    protected readonly prisma: PrismaService,
    protected readonly delegate: TDelegate,
  ) {}

  async findById(id: string, options?: FindByIdOptions): Promise<TEntity | null> {
    const result = await this.delegate.findUnique({
      where: { id },
      ...(options?.include ? { include: options.include } : {}),
    });
    return (result as TEntity | null) ?? null;
  }

  async paginate(params: PaginateParams): Promise<PaginateResult<TEntity>> {
    const { page, limit, where, orderBy } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.delegate.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.delegate.count({ where }),
    ]);

    return {
      items: items as TEntity[],
      total,
      page,
      limit,
    };
  }
}

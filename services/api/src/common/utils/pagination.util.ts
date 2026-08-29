import type { PaginatedMeta, PaginatedResponse } from '@marketplace/types';

import type { PaginateResult } from '../../infrastructure/database/base.repository';

export function toPaginatedResponse<T>(
  result: PaginateResult<T>,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(result.total / result.limit) || 0;

  const meta: PaginatedMeta = {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages,
    hasNextPage: result.page < totalPages,
    hasPreviousPage: result.page > 1,
  };

  return {
    success: true,
    data: result.items,
    meta,
  };
}

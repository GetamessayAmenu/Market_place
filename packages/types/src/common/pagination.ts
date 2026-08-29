export type SortOrder = 'asc' | 'desc';

export interface PaginatedMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  readonly success: true;
  readonly data: readonly T[];
  readonly meta: PaginatedMeta;
}

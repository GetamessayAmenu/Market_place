export const SEARCH_INDEX_JOB = {
  UPSERT: 'upsert',
  DELETE: 'delete',
} as const;

export type SearchIndexJobName =
  (typeof SEARCH_INDEX_JOB)[keyof typeof SEARCH_INDEX_JOB];

export const RATE_LIMIT_SEARCH_PREFIX = 'search' as const;

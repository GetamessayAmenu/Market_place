/**
 * @marketplace/web — Public marketplace frontend (Next.js App Router).
 * Full implementation: Phase 9.
 */
import { APP_NAME } from '@marketplace/config';
import { slugify } from '@marketplace/utils';
import { cn } from '@marketplace/ui';
import type { UserRole } from '@marketplace/types';

export const WEB_APP_META = {
  name: APP_NAME,
  slugExample: slugify('Sample Listing Title'),
  cn,
} as const;

export type { UserRole };

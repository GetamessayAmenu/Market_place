/**
 * @marketplace/api — NestJS modular monolith REST API.
 * Bootstrap: Phase 3. Auth: Phase 4. Listings: Phase 5.
 */
import { API_VERSION } from '@marketplace/config';
import type { ApiEnv } from '@marketplace/config';

export const API_SERVICE_META = {
  version: API_VERSION,
  name: '@marketplace/api',
} as const;

export type { ApiEnv };

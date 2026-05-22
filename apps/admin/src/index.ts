/**
 * @marketplace/admin — Enterprise admin dashboard.
 * Full implementation: Phase 10.
 */
import { USER_ROLES } from '@marketplace/types';

export const ADMIN_ROLES = USER_ROLES.filter(
  (role) => role === 'moderator' || role === 'admin' || role === 'super_admin' || role === 'support',
);

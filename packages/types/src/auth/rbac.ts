/**
 * Canonical roles — must stay in sync with Prisma seed (Phase 2).
 */
export const USER_ROLES = [
  'guest',
  'buyer',
  'seller',
  'moderator',
  'admin',
  'super_admin',
  'support',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type PermissionResource =
  | 'listing'
  | 'user'
  | 'report'
  | 'conversation'
  | 'notification'
  | 'admin_log'
  | 'audit_log'
  | 'verification'
  | 'category'
  | 'settings';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'moderate'
  | 'approve'
  | 'suspend'
  | 'export'
  | 'manage';

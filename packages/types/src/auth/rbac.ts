/**
 * Canonical roles — must stay in sync with Prisma seed.
 */
export const USER_ROLES = [
  'guest',
  'buyer',
  'seller',
  'moderator',
  'content_manager',
  'admin',
  'platform_admin',
  'super_admin',
  'support',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const SYSTEM_ADMIN_ROLES = [
  'super_admin',
  'platform_admin',
  'admin',
  'moderator',
  'content_manager',
  'support',
] as const;

export type SystemAdminRole = (typeof SYSTEM_ADMIN_ROLES)[number];

export type PermissionResource =
  | 'listing'
  | 'listings'
  | 'user'
  | 'users'
  | 'seller'
  | 'sellers'
  | 'order'
  | 'orders'
  | 'rental'
  | 'rentals'
  | 'custom_order'
  | 'custom_orders'
  | 'category'
  | 'categories'
  | 'dispute'
  | 'disputes'
  | 'report'
  | 'reports'
  | 'chat_report'
  | 'chat_reports'
  | 'conversation'
  | 'notification'
  | 'notifications'
  | 'admin_log'
  | 'audit_log'
  | 'audit_logs'
  | 'analytics'
  | 'verification'
  | 'cms'
  | 'cms.hero'
  | 'cms.homepage'
  | 'cms.featured_listings'
  | 'cms.featured_sellers'
  | 'cms.seo'
  | 'cms.media'
  | 'admin'
  | 'admins'
  | 'role'
  | 'roles'
  | 'permission'
  | 'permissions'
  | 'setting'
  | 'settings'
  | 'security'
  | 'feature_flag'
  | 'feature_flags'
  | string;

export type PermissionAction =
  | 'view'
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'moderate'
  | 'approve'
  | 'reject'
  | 'feature'
  | 'suspend'
  | 'verify'
  | 'manage'
  | 'assign_roles'
  | 'assign_permissions'
  | 'export'
  | string;

export interface PermissionDefinition {
  readonly id?: string;
  readonly resource: string;
  readonly action: string;
  readonly description?: string | null;
}

export interface RoleDefinition {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string | null;
  readonly isSystem: boolean;
  readonly permissions?: PermissionDefinition[];
  readonly userCount?: number;
}


export const ADMIN_ROLES = [
  'super_admin',
  'platform_admin',
  'admin',
  'moderator',
  'content_manager',
  'support',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  roles?: string[];
  permissions?: string[];
  isSuperAdmin?: boolean;
  mfaEnabled?: boolean;
}

export function isAdminRole(role: string | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

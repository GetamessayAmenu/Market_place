export const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'support'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  roles?: string[];
}

export function isAdminRole(role: string | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

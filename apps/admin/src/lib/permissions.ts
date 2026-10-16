import type { AuthUser } from '@marketplace/types';

export interface MinimalUserForAuth {
  role?: string;
  roles?: string[];
  permissions?: string[];
  isSuperAdmin?: boolean;
}

/**
 * Normalizes a permission string to a canonical representation.
 * Handles "resource.action", "resource:action", subresources like "cms.hero.manage",
 * and singular/plural resource forms.
 */
function normalizePermission(perm: string): string {
  const clean = perm.toLowerCase().trim();
  let resource: string;
  let action: string;

  if (clean.includes(':')) {
    const lastColon = clean.lastIndexOf(':');
    resource = clean.slice(0, lastColon);
    action = clean.slice(lastColon + 1);
  } else if (clean.includes('.')) {
    const lastDot = clean.lastIndexOf('.');
    resource = clean.slice(0, lastDot);
    action = clean.slice(lastDot + 1);
  } else {
    return clean;
  }

  const normalizedResource = resource.replace(/\./g, ':');
  const singular =
    normalizedResource.endsWith('s') &&
    !['cms', 'settings'].includes(normalizedResource) &&
    !normalizedResource.endsWith(':cms') &&
    !normalizedResource.endsWith(':settings')
      ? normalizedResource.slice(0, -1)
      : normalizedResource;

  return `${singular}:${action}`;
}

/**
 * Checks whether a user possesses a specific permission.
 * Super Admin bypasses all checks centrally.
 */
export function can(permission: string, user?: MinimalUserForAuth | AuthUser | null): boolean {
  if (!user) return false;

  // Super Admin possesses all permissions centrally
  if (isSuperAdmin(user)) {
    return true;
  }

  if (!user.permissions || user.permissions.length === 0) {
    return false;
  }

  const normalizedTarget = normalizePermission(permission);

  return user.permissions.some((p) => {
    if (p === '*' || p === '*:*') return true;
    const normalizedUserPerm = normalizePermission(p);
    return (
      normalizedUserPerm === normalizedTarget ||
      p.toLowerCase().trim() === permission.toLowerCase().trim()
    );
  });
}

/**
 * Checks whether a user holds a specific administrative role.
 */
export function hasRole(role: string, user?: MinimalUserForAuth | AuthUser | null): boolean {
  if (!user) return false;
  if (role === 'super_admin' && isSuperAdmin(user)) return true;
  if (user.role === role) return true;
  if (user.roles && user.roles.includes(role)) return true;
  return false;
}

/**
 * Checks whether a user is a designated Super Admin.
 */
export function isSuperAdmin(user?: MinimalUserForAuth | AuthUser | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin === true) return true;
  if (user.role === 'super_admin') return true;
  if (user.roles && user.roles.includes('super_admin')) return true;
  return false;
}

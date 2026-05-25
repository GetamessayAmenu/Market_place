import type { PermissionAction, PermissionResource, UserRole } from '@marketplace/types';

export interface UserPermission {
  readonly resource: PermissionResource;
  readonly action: PermissionAction;
}

/**
 * Attached to request by JWT strategy (Phase 4).
 */
export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly permissions: readonly UserPermission[];
  readonly status: string;
  readonly sessionId: string;
}

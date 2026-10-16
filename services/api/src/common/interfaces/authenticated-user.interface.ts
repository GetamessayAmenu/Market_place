import type { PermissionAction, PermissionResource, UserRole } from '@marketplace/types';

export interface UserPermission {
  readonly resource: PermissionResource;
  readonly action: PermissionAction;
  readonly key?: string;
}

/**
 * Attached to request by JWT strategy.
 */
export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly roles?: readonly UserRole[];
  readonly permissions: readonly UserPermission[];
  readonly status: string;
  readonly sessionId: string;
  readonly isSuperAdmin?: boolean;
  readonly mfaEnabled?: boolean;
  readonly displayName?: string;
}

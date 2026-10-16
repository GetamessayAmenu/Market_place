import { SetMetadata } from '@nestjs/common';
import type { PermissionAction, PermissionResource } from '@marketplace/types';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  readonly resource: PermissionResource | string;
  readonly action: PermissionAction | string;
}

export type PermissionRequirement = RequiredPermission | string;

export function normalizePermissionRequirement(req: PermissionRequirement): { resource: string; action: string } {
  if (typeof req === 'string') {
    const delimiter = req.includes('.') ? '.' : ':';
    const [resource, ...actionParts] = req.split(delimiter);
    return { resource: resource ?? '', action: actionParts.join(delimiter) };
  }
  return { resource: req.resource, action: req.action };
}

export const Permissions = (
  ...permissions: PermissionRequirement[]
): ReturnType<typeof SetMetadata> => SetMetadata(PERMISSIONS_KEY, permissions);

export const RequirePermission = (
  permission: PermissionRequirement
): ReturnType<typeof SetMetadata> => SetMetadata(PERMISSIONS_KEY, [permission]);

export const RequirePermissions = (
  ...permissions: PermissionRequirement[]
): ReturnType<typeof SetMetadata> => SetMetadata(PERMISSIONS_KEY, permissions);


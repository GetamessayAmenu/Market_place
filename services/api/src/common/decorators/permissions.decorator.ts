import { SetMetadata } from '@nestjs/common';
import type { PermissionAction, PermissionResource } from '@marketplace/types';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  readonly resource: PermissionResource;
  readonly action: PermissionAction;
}

export const Permissions = (
  ...permissions: RequiredPermission[]
): ReturnType<typeof SetMetadata> => SetMetadata(PERMISSIONS_KEY, permissions);

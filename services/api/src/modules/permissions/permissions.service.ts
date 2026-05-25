import { Injectable } from '@nestjs/common';
import type { PermissionAction, PermissionResource } from '@marketplace/types';

import type { UserPermission } from '../../common/interfaces/authenticated-user.interface';
import { PermissionsRepository } from './permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async getPermissionsForRole(roleId: string): Promise<readonly UserPermission[]> {
    const permissions = await this.permissionsRepository.findByRoleId(roleId);
    return permissions.map((p) => ({
      resource: p.resource as PermissionResource,
      action: p.action as PermissionAction,
    }));
  }
}

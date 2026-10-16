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

  async listAllGrouped() {
    const all = await this.permissionsRepository.findAll();
    const grouped: Record<string, { id: string; resource: string; action: string; description: string | null }[]> = {};
    for (const p of all) {
      const list = grouped[p.resource] ?? [];
      list.push({
        id: p.id,
        resource: p.resource,
        action: p.action,
        description: p.description,
      });
      grouped[p.resource] = list;
    }
    return {
      total: all.length,
      grouped,
      permissions: all,
    };
  }
}

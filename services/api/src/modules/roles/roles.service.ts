import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserRole } from '@marketplace/types';

import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async getRoleIdBySlug(slug: UserRole): Promise<string> {
    const role = await this.rolesRepository.findBySlug(slug);
    if (!role) {
      throw new NotFoundException(`Role not found: ${slug}`);
    }
    return role.id;
  }

  async resolveRoleSlug(roleId: string): Promise<UserRole> {
    const role = await this.rolesRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role.slug as UserRole;
  }
}

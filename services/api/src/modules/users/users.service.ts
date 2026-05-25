import { Injectable } from '@nestjs/common';
import type { AuthUser, UserRole } from '@marketplace/types';

import type { AuthenticatedUserPayload } from '../../common/interfaces/authenticated-user-payload.interface';
import { PermissionsService } from '../permissions/permissions.service';
import type { UserWithRole } from './users.repository';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly permissionsService: PermissionsService,
  ) {}

  async findById(id: string): Promise<UserWithRole | null> {
    return this.usersRepository.findActiveById(id);
  }

  async toAuthenticatedUser(user: UserWithRole): Promise<AuthenticatedUserPayload> {
    const permissions = await this.permissionsService.getPermissionsForRole(user.roleId);
    return {
      id: user.id,
      email: user.email,
      role: user.role.slug as UserRole,
      permissions,
      status: user.status,
    };
  }

  toAuthUser(user: UserWithRole): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role.slug as AuthUser['role'],
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerifiedAt !== null,
      phoneVerified: user.phoneVerifiedAt !== null,
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserRole } from '@marketplace/types';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { SecurityEventsService } from '../security-events/security-events.service';
import type {
  AssignRolePermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly adminLogsService: AdminLogsService,
    private readonly securityEventsService: SecurityEventsService,
  ) {}

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

  async listRoles() {
    return this.rolesRepository.findAllWithCounts();
  }

  async getRole(id: string) {
    const role = await this.rolesRepository.findByIdWithPermissions(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const userCount = await this.rolesRepository.countAssignedUsers(id);

    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
    };
  }

  async createRole(currentUser: AuthenticatedUser, dto: CreateRoleDto) {
    const existing = await this.rolesRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Role with slug '${dto.slug}' already exists.`);
    }

    const role = await this.rolesRepository.create({
      name: dto.name,
      slug: dto.slug,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      isSystem: false,
    });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      await this.rolesRepository.syncRolePermissions(role.id, dto.permissionIds);
    }

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'ROLE_CREATED',
      resource: 'role',
      resourceId: role.id,
      metadata: { name: role.name, slug: role.slug },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'ROLE_CREATED',
      severity: 'INFO',
      actorId: currentUser.id,
      details: { roleId: role.id, slug: role.slug },
      status: 'SUCCESS',
    });

    return this.getRole(role.id);
  }

  async updateRole(currentUser: AuthenticatedUser, id: string, dto: UpdateRoleDto) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const updated = await this.rolesRepository.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    });

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'ROLE_UPDATED',
      resource: 'role',
      resourceId: id,
      metadata: { name: updated.name },
    });

    return this.getRole(id);
  }

  async deleteRole(currentUser: AuthenticatedUser, id: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('Mandatory system roles cannot be deleted.');
    }

    const assignedCount = await this.rolesRepository.countAssignedUsers(id);
    if (assignedCount > 0) {
      throw new BadRequestException(
        `Cannot delete role because it is currently assigned to ${assignedCount} user(s). Reassign them first.`,
      );
    }

    await this.rolesRepository.delete(id);

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'ROLE_DELETED',
      resource: 'role',
      resourceId: id,
      metadata: { slug: role.slug, name: role.name },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'ROLE_DELETED',
      severity: 'WARNING',
      actorId: currentUser.id,
      details: { slug: role.slug, name: role.name },
      status: 'SUCCESS',
    });

    return { success: true, message: `Role '${role.name}' deleted successfully.` };
  }

  async syncRolePermissions(
    currentUser: AuthenticatedUser,
    id: string,
    dto: AssignRolePermissionsDto,
  ) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.slug === 'super_admin') {
      throw new BadRequestException(
        'The SUPER_ADMIN role has full platform authorization centrally and its permissions cannot be modified.',
      );
    }

    await this.rolesRepository.syncRolePermissions(id, dto.permissionIds);

    // Invalidate cached permissions for all users assigned to this role
    const userIds = await this.rolesRepository.findUserIdsWithRoleId(id);
    await Promise.all(
      userIds.map((uId) => this.authorizationService.invalidateUserPermissions(uId)),
    );

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'ROLE_PERMISSIONS_UPDATED',
      resource: 'role',
      resourceId: id,
      metadata: { permissionCount: dto.permissionIds.length },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'ROLE_PERMISSIONS_UPDATED',
      severity: 'INFO',
      actorId: currentUser.id,
      details: { roleSlug: role.slug, permissionCount: dto.permissionIds.length },
      status: 'SUCCESS',
    });

    return this.getRole(id);
  }
}

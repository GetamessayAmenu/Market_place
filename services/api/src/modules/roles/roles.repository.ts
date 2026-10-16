import { Injectable } from '@nestjs/common';
import type { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    rolePermissions: { include: { permission: true } };
  };
}>;

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { slug } });
  }

  async findBySlugWithPermissions(slug: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { slug },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async findByIdWithPermissions(id: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async findAllWithCounts() {
    const roles = await this.prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            rolePermissions: true,
            userRoles: true,
            users: true,
          },
        },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      permissionCount: r._count.rolePermissions,
      userCount: r._count.users + r._count.userRoles,
    }));
  }

  async create(data: { name: string; slug: string; description?: string; isSystem?: boolean }): Promise<Role> {
    return this.prisma.role.create({
      data: {
        name: data.name,
        slug: data.slug,
        ...(data.description !== undefined ? { description: data.description } : {}),
        isSystem: data.isSystem ?? false,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async countAssignedUsers(roleId: string): Promise<number> {
    const [primary, secondary] = await Promise.all([
      this.prisma.user.count({ where: { roleId, deletedAt: null } }),
      this.prisma.userRole.count({ where: { roleId } }),
    ]);
    return primary + secondary;
  }

  async syncRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((pId) => ({
            roleId,
            permissionId: pId,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  async findUserIdsWithRoleId(roleId: string): Promise<string[]> {
    const [primaryUsers, secondaryUserRoles] = await Promise.all([
      this.prisma.user.findMany({ where: { roleId }, select: { id: true } }),
      this.prisma.userRole.findMany({ where: { roleId }, select: { userId: true } }),
    ]);

    const ids = new Set<string>();
    primaryUsers.forEach((u) => ids.add(u.id));
    secondaryUserRoles.forEach((ur) => ids.add(ur.userId));
    return Array.from(ids);
  }
}

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
}

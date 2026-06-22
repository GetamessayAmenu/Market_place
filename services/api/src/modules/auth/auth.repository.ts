import { Injectable } from '@nestjs/common';
import type { UserStatus } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { UserWithRole } from '../users/users.repository';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
    return count > 0;
  }

  async phoneExists(phone: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { phone, deletedAt: null },
    });
    return count > 0;
  }

  async createUser(params: {
    email: string;
    passwordHash: string;
    displayName: string;
    roleId: string;
    phone?: string;
    status?: UserStatus;
  }): Promise<UserWithRole> {
    return this.prisma.user.create({
      data: {
        email: params.email.toLowerCase(),
        passwordHash: params.passwordHash,
        displayName: params.displayName,
        roleId: params.roleId,
        ...(params.phone !== undefined ? { phone: params.phone } : {}),
        status: params.status ?? 'pending_verification',
      },
      include: { role: true },
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        status: 'active',
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}

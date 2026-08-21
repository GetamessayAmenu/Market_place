import type { AuthUser, UserRole } from '@marketplace/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { AuthenticatedUserPayload } from '../../common/interfaces/authenticated-user-payload.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RolesService } from '../roles/roles.service';

import type { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { UserQueryDto } from './dto/user-query.dto';
import type { UserWithRole } from './users.repository';
import { UsersRepository } from './users.repository';

// Simple event emitter for Socket.IO integration
class EventEmitter {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const eventEmitter = new EventEmitter();

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly permissionsService: PermissionsService,
    private readonly rolesService: RolesService,
    private readonly adminLogsService: AdminLogsService,
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

  async suspendUser(admin: { id: string }, targetUserId: string, reason?: string): Promise<void> {
    const target = await this.usersRepository.findActiveById(targetUserId);
    if (!target) throw new Error('User not found');
    await this.usersRepository.updateStatus(targetUserId, 'suspended');
    try {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'user.suspended',
        resource: 'user',
        resourceId: targetUserId,
        metadata: { reason },
      });
    } catch {
      // do not block
    }
  }

  async banUser(admin: { id: string }, targetUserId: string, reason?: string): Promise<void> {
    const target = await this.usersRepository.findActiveById(targetUserId);
    if (!target) throw new Error('User not found');
    await this.usersRepository.updateStatus(targetUserId, 'banned');
    try {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'user.banned',
        resource: 'user',
        resourceId: targetUserId,
        metadata: { reason },
      });
    } catch {
      // do not block
    }
  }

  async activateUser(admin: { id: string }, targetUserId: string, reason?: string): Promise<void> {
    const target = await this.usersRepository.findActiveById(targetUserId);
    if (!target) throw new Error('User not found');
    await this.usersRepository.updateStatus(targetUserId, 'active');
    try {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'user.activated',
        resource: 'user',
        resourceId: targetUserId,
        metadata: { reason },
      });
    } catch {
      // do not block
    }
  }

  async updateRole(admin: { id: string }, targetUserId: string, roleSlug: string, reason?: string): Promise<UserWithRole> {
    const target = await this.usersRepository.findActiveById(targetUserId);
    if (!target) throw new NotFoundException('User not found');
    const roleId = await this.rolesService.getRoleIdBySlug(roleSlug as UserRole);
    const updated = await this.usersRepository.updateRole(targetUserId, roleId);
    try {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'user.role_changed',
        resource: 'user',
        resourceId: targetUserId,
        metadata: { previousRole: target.role.slug, newRole: roleSlug, reason },
      });
    } catch {
      // do not block
    }
    return updated;
  }

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.role ? { role: { slug: query.role } } : {}),
      ...(query.search
        ? {
            OR: [
              { displayName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const result = await this.usersRepository.findManyPaginated({
      where,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
      page,
      limit,
    });

    return toPaginatedResponse({
      ...result,
      items: result.items.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        status: u.status,
        role: u.role.slug,
        emailVerifiedAt: u.emailVerifiedAt,
        phoneVerifiedAt: u.phoneVerifiedAt,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
    });
  }

  async findOne(id: string) {
    try {
      const user = await this.usersRepository.findProfileById(id);
      if (!user) throw new NotFoundException('User not found');
      
      // Return a simplified version to avoid circular references
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        sellerType: user.sellerType,
        coverImageUrl: user.coverImageUrl,
        specialties: user.specialties,
        socialLinks: user.socialLinks,
        responseRate: user.responseRate,
        responseTimeHours: user.responseTimeHours,
        totalSales: user.totalSales,
        status: user.status,
        role: user.role.slug,
        emailVerifiedAt: user.emailVerifiedAt,
        phoneVerifiedAt: user.phoneVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        _count: user._count || { listings: 0, storeFollowers: 0 },
      };
    } catch (error) {
      console.error('Error in findOne:', error);
      throw error;
    }
  }

  async adminUpdate(admin: { id: string }, targetUserId: string, dto: AdminUpdateUserDto) {
    if (dto.status === 'suspended') {
      await this.suspendUser(admin, targetUserId, dto.reason);
    } else if (dto.status === 'banned') {
      await this.banUser(admin, targetUserId, dto.reason);
    } else if (dto.status === 'active') {
      await this.activateUser(admin, targetUserId, dto.reason);
    }

    if (dto.role) {
      return this.updateRole(admin, targetUserId, dto.role, dto.reason);
    }

    return this.findOne(targetUserId);
  }

  async getStatusCounts() {
    return this.usersRepository.countByStatus();
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findActiveById(userId);
    if (!user) throw new NotFoundException('User not found');

    const data: Record<string, string> = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.phone !== undefined) data.phone = dto.phone;

    if (Object.keys(data).length === 0) {
      return this.toAuthUser(user);
    }

    const updated = await this.usersRepository.updateProfile(userId, data);
    return this.toAuthUser(updated);
  }

  async deleteSelf(userId: string): Promise<{ readonly deleted: true }> {
    const user = await this.usersRepository.findActiveById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.softDeleteSelf(userId);
    try {
      await this.adminLogsService.createLog({
        actorId: userId,
        action: 'user.self_deleted',
        resource: 'user',
        resourceId: userId,
      });
    } catch {
      // non-fatal
    }
    return { deleted: true };
  }

  // ─── Store Follow Feature ───────────────────────────────────────────────────

  async toggleStoreFollow(userId: string, storeId: string) {
    const store = await this.usersRepository.findActiveById(storeId);
    if (!store) throw new NotFoundException('Store not found');

    const existingFollow = await this.usersRepository.findStoreFollow(userId, storeId);

    if (existingFollow) {
      // Unfollow
      await this.usersRepository.deleteStoreFollow(existingFollow.id);
      const followerCount = await this.usersRepository.countStoreFollowers(storeId);
      
      // Emit real-time event
      eventEmitter.emit('store_follower_updated', {
        storeId,
        followerCount,
        isFollowing: false,
        userId,
      });
      
      return { isFollowing: false, followerCount };
    } else {
      // Follow
      await this.usersRepository.createStoreFollow(userId, storeId);
      const followerCount = await this.usersRepository.countStoreFollowers(storeId);
      
      // Emit real-time event
      eventEmitter.emit('store_follower_updated', {
        storeId,
        followerCount,
        isFollowing: true,
        userId,
      });
      
      return { isFollowing: true, followerCount };
    }
  }

  async getFollowing(userId: string) {
    const follows = await this.usersRepository.findStoreFollowsByFollower(userId);

    return follows.map((follow: any) => ({
      id: follow.id,
      storeId: follow.storeId,
      store: follow.store,
      followedAt: follow.createdAt,
    }));
  }

  async findUserListings(userId: string) {
    const listings = await this.usersRepository.findUserListings(userId);

    return {
      success: true,
      data: listings,
      meta: {
        total: listings.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };
  }
}

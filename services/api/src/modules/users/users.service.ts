import type { AuthUser, UserRole } from '@marketplace/types';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
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
    const roleIds = [user.roleId, ...(user.userRoles?.map((ur) => ur.roleId) ?? [])];
    const uniqueRoleIds = Array.from(new Set(roleIds));

    const permissionLists = await Promise.all(
      uniqueRoleIds.map((rId) => this.permissionsService.getPermissionsForRole(rId)),
    );
    const allPermissions = permissionLists.flat();
    const seen = new Set<string>();
    const permissions = allPermissions.filter((p) => {
      const key = `${p.resource}.${p.action}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const roles = Array.from(
      new Set([user.role.slug, ...(user.userRoles?.map((ur) => ur.role.slug) ?? [])]),
    ) as UserRole[];

    const isSuperAdmin = roles.includes('super_admin');

    return {
      id: user.id,
      email: user.email,
      role: user.role.slug as UserRole,
      roles,
      permissions,
      status: user.status,
      isSuperAdmin,
      mfaEnabled: user.adminProfile?.mfaEnabled ?? false,
      displayName: user.displayName,
    };
  }

  async getUserPermissionStrings(user: UserWithRole): Promise<string[]> {
    const roleIds = [user.roleId, ...(user.userRoles?.map((ur) => ur.roleId) ?? [])];
    const uniqueRoleIds = Array.from(new Set(roleIds));
    const permissionLists = await Promise.all(
      uniqueRoleIds.map((rId) => this.permissionsService.getPermissionsForRole(rId)),
    );
    const seen = new Set<string>();
    permissionLists.flat().forEach((p) => {
      seen.add(`${p.resource}.${p.action}`);
      seen.add(`${p.resource}:${p.action}`);
    });
    return Array.from(seen);
  }

  toAuthUser(user: UserWithRole, permissionsList?: string[]): AuthUser {
    const roles = Array.from(
      new Set([user.role.slug, ...(user.userRoles?.map((ur) => ur.role.slug) ?? [])]),
    ) as UserRole[];

    return {
      id: user.id,
      email: user.email,
      role: user.role.slug as AuthUser['role'],
      roles,
      ...(permissionsList !== undefined ? { permissions: permissionsList } : {}),
      isSuperAdmin: roles.includes('super_admin'),
      mfaEnabled: user.adminProfile?.mfaEnabled ?? false,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerifiedAt !== null,
      phoneVerified: user.phoneVerifiedAt !== null,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      sellerType: user.sellerType,
      socialLinks: (user.socialLinks as Record<string, any>) || null,
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

  async findOne(
    id: string,
    viewer?: AuthenticatedUser | { id: string; role?: string; roles?: readonly string[] | string[] },
  ) {
    try {
      const user = await this.usersRepository.findProfileById(id);
      if (!user) throw new NotFoundException('User not found');

      const aggregates = await this.usersRepository.getSellerAggregates(id);

      const isOwner = viewer?.id === user.id;
      const isAdmin =
        viewer?.role === 'admin' ||
        viewer?.role === 'super_admin' ||
        viewer?.roles?.includes('admin') ||
        viewer?.roles?.includes('super_admin');
      const isPrivileged = isOwner || isAdmin;

      const isVerified = Boolean(
        user.vendorKycProfile?.status === 'APPROVED' ||
        user.isVerifiedDesigner ||
        user.phoneVerifiedAt !== null ||
        user.emailVerifiedAt !== null,
      );

      return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
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
        isVerifiedDesigner: user.isVerifiedDesigner,
        isVerified,
        verificationStatus:
          user.vendorKycProfile?.status === 'APPROVED'
            ? 'verified'
            : user.isVerifiedDesigner
              ? 'verified'
              : 'unverified',
        businessName: user.vendorKycProfile?.businessName ?? null,
        rating: aggregates.averageRating,
        reviewCount: aggregates.reviewCount,
        listingCounts: aggregates.listingCounts,
        followerCount: user._count?.storeFollowers ?? 0,
        lastLoginAt: isPrivileged ? user.lastLoginAt : null,
        createdAt: user.createdAt,
        _count: {
          listings: aggregates.listingCounts.all,
          storeFollowers: user._count?.storeFollowers ?? 0,
          favorites: user._count?.favorites ?? 0,
        },
        ...(isPrivileged ? { email: user.email, phone: user.phone } : {}),
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

    const data: Record<string, any> = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.sellerType !== undefined) data.sellerType = dto.sellerType;
    if (dto.socialLinks !== undefined) {
      const existingSocial = (user.socialLinks as Record<string, any>) || {};
      data.socialLinks = { ...existingSocial, ...dto.socialLinks };
    }

    if (Object.keys(data).length === 0) {
      return this.toAuthUser(user);
    }

    const updated = await this.usersRepository.updateProfile(userId, data);
    return this.toAuthUser(updated);
  }

  async deleteSelf(userId: string): Promise<{ readonly deleted: true }> {
    const user = await this.usersRepository.findActiveById(userId);
    if (!user) throw new NotFoundException('User not found');

    const activeRentals = await this.usersRepository.countActiveRentals(userId);
    if (activeRentals > 0) {
      throw new BadRequestException(
        `Cannot delete account with ${activeRentals} active or pending rental order(s). Please complete ongoing rentals and settle collateral deposits first.`,
      );
    }

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

  async findUserListings(
    userId: string,
    query?: {
      page?: number;
      limit?: number;
      type?: 'all' | 'buy' | 'rent' | 'custom';
      sortBy?: 'newest' | 'price_asc' | 'price_desc';
    },
    viewer?: AuthenticatedUser | { id: string },
  ) {
    const isOwner = viewer?.id === userId;
    const result = await this.usersRepository.findUserListings(userId, {
      ...query,
      isOwner,
    });

    const listings = result.items.map((l) => ({
      ...l,
      price: Number(l.price),
      rentalPricePerDay: l.rentalPricePerDay ? Number(l.rentalPricePerDay) : null,
      rentalDeposit: l.rentalDeposit ? Number(l.rentalDeposit) : null,
      startingCustomPrice: l.startingCustomPrice ? Number(l.startingCustomPrice) : null,
      primaryImageUrl: l.images?.[0]?.url ?? null,
    }));

    return {
      success: true,
      data: listings,
      counts: result.counts,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}

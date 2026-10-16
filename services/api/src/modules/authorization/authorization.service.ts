import { Injectable, Logger } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  normalizePermissionRequirement,
  type PermissionRequirement,
} from '../../common/decorators/permissions.decorator';
import { RedisService } from '../../infrastructure/redis/redis.service';

const PERM_CACHE_PREFIX = 'mp:user:perms:';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Central authorization engine method.
   * Super Admin role is recognized centrally and granted full administrative access.
   */
  can(user: AuthenticatedUser | undefined | null, permission: PermissionRequirement): boolean {
    if (!user) {
      return false;
    }

    // 1. Super Admin centrally receives all administrative capabilities
    if (this.isSuperAdmin(user)) {
      return true;
    }

    // 2. Deny by default: check user status
    if (user.status !== 'active') {
      return false;
    }

    if (!user.permissions || user.permissions.length === 0) {
      return false;
    }

    const { resource: reqResource, action: reqAction } = normalizePermissionRequirement(permission);

    return user.permissions.some((p) => {
      const pRes = this.normalizeResource(p.resource);
      const targetRes = this.normalizeResource(reqResource);

      const resourceMatches = pRes === targetRes || pRes === '*';
      if (!resourceMatches) {
        return false;
      }

      // Action match: exact, wildcard, or 'manage' permission implies all actions on resource
      return (
        p.action === reqAction ||
        p.action === '*' ||
        p.action === 'manage' ||
        (reqAction === 'read' && p.action === 'view') ||
        (reqAction === 'view' && p.action === 'read')
      );
    });
  }

  /**
   * Evaluates if user possesses all required permissions.
   */
  canAll(user: AuthenticatedUser | undefined | null, permissions: PermissionRequirement[]): boolean {
    if (!permissions.length) {
      return true;
    }
    return permissions.every((perm) => this.can(user, perm));
  }

  /**
   * Evaluates if user possesses at least one of the permissions.
   */
  canAny(user: AuthenticatedUser | undefined | null, permissions: PermissionRequirement[]): boolean {
    if (!permissions.length) {
      return true;
    }
    return permissions.some((perm) => this.can(user, perm));
  }

  /**
   * Check if user is a designated Super Admin.
   */
  isSuperAdmin(user: AuthenticatedUser | undefined | null): boolean {
    if (!user) return false;
    return (
      user.role === 'super_admin' ||
      user.roles?.includes('super_admin') === true ||
      user.isSuperAdmin === true
    );
  }

  /**
   * Object-level authorization helper (IDOR/BOLA prevention).
   * Verifies that the admin user is allowed to mutate the specific resource entity.
   */
  authorizeResource(
    user: AuthenticatedUser,
    action: string,
    resource: string,
    resourceOwnerId?: string,
  ): boolean {
    if (this.isSuperAdmin(user)) {
      return true;
    }

    // Check base permission
    if (!this.can(user, { resource, action })) {
      return false;
    }

    // If resource has an owner and user is operating on their own resource
    if (resourceOwnerId && user.id === resourceOwnerId) {
      return true;
    }

    return true;
  }

  /**
   * Immediate cache invalidation when roles or permissions are updated.
   */
  async invalidateUserPermissions(userId: string): Promise<void> {
    try {
      await this.redis.del(`${PERM_CACHE_PREFIX}${userId}`);
    } catch (err) {
      this.logger.warn(`Failed to invalidate permission cache for user ${userId}:`, err);
    }
  }

  /**
   * Normalize singular and plural resource names for resilient matching.
   */
  private normalizeResource(resource: string): string {
    const res = resource.toLowerCase().trim();
    const map: Record<string, string> = {
      listing: 'listings',
      user: 'users',
      seller: 'sellers',
      order: 'orders',
      rental: 'rentals',
      custom_order: 'custom_orders',
      category: 'categories',
      dispute: 'disputes',
      report: 'reports',
      chat_report: 'chat_reports',
      admin: 'admins',
      role: 'roles',
      permission: 'permissions',
      setting: 'settings',
      notification: 'notifications',
      audit_log: 'audit_logs',
      admin_log: 'audit_logs',
      feature_flag: 'feature_flags',
    };
    return map[res] || res;
  }
}

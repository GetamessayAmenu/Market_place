import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { generateRecoveryCodes } from '../auth/utils/mfa.util';
import { hashPassword } from '../auth/utils/password.util';
import { AuthorizationService } from '../authorization/authorization.service';
import { SecurityEventsService } from '../security-events/security-events.service';
import { SessionsService } from '../sessions/sessions.service';
import type {
  AdminQueryDto,
  CreateAdminUserDto,
  ResetMfaDto,
  SuspendAdminDto,
  UpdateAdminRoleDto,
} from './dto/admin-user.dto';

const SYSTEM_ADMIN_ROLE_SLUGS = [
  'super_admin',
  'platform_admin',
  'admin',
  'moderator',
  'content_manager',
  'support',
];

@Injectable()
export class AdminManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly adminLogsService: AdminLogsService,
    private readonly securityEventsService: SecurityEventsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  /**
   * List all administrative users with search, role filter, status filter, and session count.
   */
  async listAdmins(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      OR: [
        { role: { slug: { in: SYSTEM_ADMIN_ROLE_SLUGS } } },
        { userRoles: { some: { role: { slug: { in: SYSTEM_ADMIN_ROLE_SLUGS } } } } },
      ],
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.role
        ? {
            OR: [
              { role: { slug: query.role } },
              { userRoles: { some: { role: { slug: query.role } } } },
            ],
          }
        : {}),
      ...(query.search
        ? {
            AND: [
              {
                OR: [
                  { email: { contains: query.search, mode: 'insensitive' } },
                  { displayName: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          role: true,
          adminProfile: true,
          userRoles: { include: { role: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const enriched = await Promise.all(
      items.map(async (u) => {
        const sessionCount = await this.sessionsService.getUserSessionCount(u.id);
        const roles = Array.from(
          new Set([u.role.slug, ...(u.userRoles?.map((ur) => ur.role.slug) ?? [])]),
        );
        return {
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          status: u.status,
          role: u.role.slug,
          roles,
          isSuperAdmin: roles.includes('super_admin'),
          mfaEnabled: u.adminProfile?.mfaEnabled ?? false,
          mfaEnforced: u.adminProfile?.mfaEnforced ?? false,
          failedLoginAttempts: u.adminProfile?.failedLoginAttempts ?? 0,
          lockedUntil: u.adminProfile?.lockedUntil,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
          activeSessionsCount: sessionCount,
        };
      }),
    );

    return toPaginatedResponse({ items: enriched, total, page, limit });
  }

  /**
   * Get an admin user by ID with full profile, roles, and active sessions.
   */
  async getAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        adminProfile: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('Admin user not found');
    }

    const sessions = await this.sessionsService.getUserSessions(id);
    const roles = Array.from(
      new Set([user.role.slug, ...(user.userRoles?.map((ur) => ur.role.slug) ?? [])]),
    );

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      role: user.role.slug,
      roles,
      isSuperAdmin: roles.includes('super_admin'),
      mfaEnabled: user.adminProfile?.mfaEnabled ?? false,
      mfaEnforced: user.adminProfile?.mfaEnforced ?? false,
      failedLoginAttempts: user.adminProfile?.failedLoginAttempts ?? 0,
      lockedUntil: user.adminProfile?.lockedUntil,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        device: s.device,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
      })),
    };
  }

  /**
   * Create a new administrative user.
   * STRICT SECURITY RULE: Only an authorized Super Admin can assign the SUPER_ADMIN role.
   */
  async createAdmin(
    currentUser: AuthenticatedUser,
    dto: CreateAdminUserDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const primaryRole = await this.prisma.role.findUnique({
      where: { slug: dto.roleSlug },
    });
    if (!primaryRole) {
      throw new NotFoundException(`Role '${dto.roleSlug}' not found.`);
    }

    const createsSuperAdmin =
      dto.roleSlug === 'super_admin' ||
      (dto.additionalRoleSlugs?.includes('super_admin') ?? false);

    if (createsSuperAdmin && !currentUser.isSuperAdmin) {
      await this.securityEventsService.recordEvent({
        eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
        severity: 'CRITICAL',
        actorId: currentUser.id,
        ipAddress,
        userAgent,
        details: {
          action: 'create_admin',
          attemptedRole: 'super_admin',
          targetEmail: dto.email,
        },
        status: 'BLOCKED',
      });
      throw new ForbiddenException('Only Super Admins can assign the SUPER_ADMIN role.');
    }

    // Resolve additional roles
    let additionalRoleRecords: { id: string; slug: string }[] = [];
    if (dto.additionalRoleSlugs && dto.additionalRoleSlugs.length > 0) {
      additionalRoleRecords = await this.prisma.role.findMany({
        where: { slug: { in: dto.additionalRoleSlugs } },
        select: { id: true, slug: true },
      });
    }

    const passwordHash = await hashPassword(dto.password);
    const recoveryCodes = generateRecoveryCodes(8);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          displayName: dto.displayName,
          roleId: primaryRole.id,
          status: 'active',
          emailVerifiedAt: new Date(),
        },
      });

      await tx.adminProfile.create({
        data: {
          userId: newUser.id,
          mfaEnforced: dto.enforceMfa ?? true,
          mfaEnabled: false,
          mfaRecoveryCodes: recoveryCodes,
        },
      });

      for (const addRole of additionalRoleRecords) {
        if (addRole.id !== primaryRole.id) {
          await tx.userRole.create({
            data: {
              userId: newUser.id,
              roleId: addRole.id,
            },
          });
        }
      }

      return newUser;
    });

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'ADMIN_USER_CREATED',
      resource: 'user',
      resourceId: user.id,
      metadata: {
        email: user.email,
        displayName: user.displayName,
        role: dto.roleSlug,
        additionalRoles: dto.additionalRoleSlugs,
      },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'ADMIN_CREATED',
      severity: createsSuperAdmin ? 'WARNING' : 'INFO',
      actorId: currentUser.id,
      targetUserId: user.id,
      ipAddress,
      userAgent,
      details: {
        role: dto.roleSlug,
        additionalRoles: dto.additionalRoleSlugs,
      },
      status: 'SUCCESS',
    });

    return this.getAdmin(user.id);
  }

  /**
   * Assign or update roles for an administrative user.
   * STRICT SECURITY RULES:
   * 1. Only Super Admin can assign or revoke the SUPER_ADMIN role.
   * 2. Cannot remove the final remaining Super Admin in the platform.
   */
  async updateAdminRole(
    currentUser: AuthenticatedUser,
    targetUserId: string,
    dto: UpdateAdminRoleDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!target || target.deletedAt !== null) {
      throw new NotFoundException('Admin user not found.');
    }

    const currentTargetRoles = Array.from(
      new Set([target.role.slug, ...(target.userRoles?.map((ur) => ur.role.slug) ?? [])]),
    );
    const targetIsSuperAdmin = currentTargetRoles.includes('super_admin');

    const newTargetRoles = Array.from(
      new Set([dto.roleSlug, ...(dto.additionalRoleSlugs ?? [])]),
    );
    const newIsSuperAdmin = newTargetRoles.includes('super_admin');

    // Escalation check: granting super_admin requires actor to be super_admin
    if (newIsSuperAdmin && !targetIsSuperAdmin && !currentUser.isSuperAdmin) {
      await this.securityEventsService.recordEvent({
        eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
        severity: 'CRITICAL',
        actorId: currentUser.id,
        targetUserId,
        ipAddress,
        userAgent,
        details: { action: 'grant_super_admin' },
        status: 'BLOCKED',
      });
      throw new ForbiddenException('Only Super Admins can assign the SUPER_ADMIN role.');
    }

    // Demotion check: modifying or removing a super_admin
    if (targetIsSuperAdmin) {
      if (!currentUser.isSuperAdmin) {
        throw new ForbiddenException('Only Super Admins can modify Super Admin accounts.');
      }

      // If removing super_admin status, verify we are not removing the LAST super admin
      if (!newIsSuperAdmin) {
        const activeSuperAdminCount = await this.countActiveSuperAdmins();
        if (activeSuperAdminCount <= 1) {
          throw new BadRequestException(
            'Cannot remove the final remaining Super Admin. Another active Super Admin must exist first.',
          );
        }
      }
    }

    const primaryRole = await this.prisma.role.findUnique({
      where: { slug: dto.roleSlug },
    });
    if (!primaryRole) {
      throw new NotFoundException(`Role '${dto.roleSlug}' not found.`);
    }

    let additionalRoles: { id: string }[] = [];
    if (dto.additionalRoleSlugs && dto.additionalRoleSlugs.length > 0) {
      additionalRoles = await this.prisma.role.findMany({
        where: { slug: { in: dto.additionalRoleSlugs } },
        select: { id: true },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: { roleId: primaryRole.id },
      });

      // Re-sync user_roles join table
      await tx.userRole.deleteMany({
        where: { userId: targetUserId },
      });

      for (const r of additionalRoles) {
        if (r.id !== primaryRole.id) {
          await tx.userRole.create({
            data: {
              userId: targetUserId,
              roleId: r.id,
            },
          });
        }
      }
    });

    // Invalidate cached permissions immediately
    await this.authorizationService.invalidateUserPermissions(targetUserId);

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'ADMIN_ROLES_UPDATED',
      resource: 'user',
      resourceId: targetUserId,
      metadata: {
        previousRoles: currentTargetRoles,
        newRoles: newTargetRoles,
      },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'ROLE_ASSIGNED',
      severity: targetIsSuperAdmin !== newIsSuperAdmin ? 'WARNING' : 'INFO',
      actorId: currentUser.id,
      targetUserId,
      ipAddress,
      userAgent,
      details: {
        previousRoles: currentTargetRoles,
        newRoles: newTargetRoles,
      },
      status: 'SUCCESS',
    });

    return this.getAdmin(targetUserId);
  }

  /**
   * Suspend an administrative user and revoke all their active sessions.
   * Safeguards:
   * - Cannot suspend oneself.
   * - Cannot suspend the last remaining Super Admin.
   * - Non-super admins cannot suspend Super Admins.
   */
  async suspendAdmin(
    currentUser: AuthenticatedUser,
    targetUserId: string,
    dto: SuspendAdminDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (currentUser.id === targetUserId) {
      throw new BadRequestException('You cannot suspend your own administrative account.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!target || target.deletedAt !== null) {
      throw new NotFoundException('Admin user not found.');
    }

    const targetRoles = Array.from(
      new Set([target.role.slug, ...(target.userRoles?.map((ur) => ur.role.slug) ?? [])]),
    );

    if (targetRoles.includes('super_admin')) {
      if (!currentUser.isSuperAdmin) {
        throw new ForbiddenException('Only Super Admins can suspend a Super Admin account.');
      }
      const count = await this.countActiveSuperAdmins();
      if (count <= 1) {
        throw new BadRequestException('Cannot suspend the final remaining active Super Admin.');
      }
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'suspended' },
    });

    // Revoke all sessions immediately upon suspension
    await this.sessionsService.invalidateAllUserSessions(targetUserId);
    await this.authorizationService.invalidateUserPermissions(targetUserId);

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'ADMIN_SUSPENDED',
      resource: 'user',
      resourceId: targetUserId,
      metadata: { reason: dto.reason },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'ADMIN_SUSPENDED',
      severity: 'WARNING',
      actorId: currentUser.id,
      targetUserId,
      ipAddress,
      userAgent,
      details: { reason: dto.reason },
      status: 'SUCCESS',
    });

    return { success: true, message: 'Admin account suspended and sessions revoked.' };
  }

  /**
   * Reactivate a suspended administrative user.
   */
  async reactivateAdmin(
    currentUser: AuthenticatedUser,
    targetUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: true,
        userRoles: { include: { role: true } },
        adminProfile: true,
      },
    });

    if (!target || target.deletedAt !== null) {
      throw new NotFoundException('Admin user not found.');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'active' },
    });

    if (target.adminProfile) {
      await this.prisma.adminProfile.update({
        where: { userId: targetUserId },
        data: {
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });
    }

    await this.authorizationService.invalidateUserPermissions(targetUserId);

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'ADMIN_REACTIVATED',
      resource: 'user',
      resourceId: targetUserId,
      metadata: {},
    });

    await this.securityEventsService.recordEvent({
      eventType: 'ADMIN_REACTIVATED',
      severity: 'INFO',
      actorId: currentUser.id,
      targetUserId,
      ipAddress,
      userAgent,
      details: {},
      status: 'SUCCESS',
    });

    return { success: true, message: 'Admin account reactivated successfully.' };
  }

  /**
   * Revoke all active sessions for a target admin user.
   */
  async revokeSessions(
    currentUser: AuthenticatedUser,
    targetUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.sessionsService.invalidateAllUserSessions(targetUserId);

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'SESSIONS_REVOKED',
      resource: 'user',
      resourceId: targetUserId,
      metadata: { action: 'admin_revoked_all_sessions' },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'SESSIONS_REVOKED',
      severity: 'INFO',
      actorId: currentUser.id,
      targetUserId,
      ipAddress,
      userAgent,
      details: { action: 'revoke_all_sessions' },
      status: 'SUCCESS',
    });

    return { success: true, message: 'All active sessions have been revoked.' };
  }

  /**
   * Secure recovery flow: Reset MFA for an admin locked out of their authenticator.
   */
  async resetMfa(
    currentUser: AuthenticatedUser,
    targetUserId: string,
    _dto: ResetMfaDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!target) {
      throw new NotFoundException('User not found.');
    }

    const roles = Array.from(
      new Set([target.role.slug, ...(target.userRoles?.map((ur) => ur.role.slug) ?? [])]),
    );

    if (roles.includes('super_admin') && !currentUser.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admins can reset MFA for a Super Admin account.');
    }

    const newRecoveryCodes = generateRecoveryCodes(8);

    await this.prisma.adminProfile.upsert({
      where: { userId: targetUserId },
      update: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaRecoveryCodes: newRecoveryCodes,
      },
      create: {
        userId: targetUserId,
        mfaEnabled: false,
        mfaSecret: null,
        mfaRecoveryCodes: newRecoveryCodes,
      },
    });

    // Invalidate sessions so the user must log in again
    await this.sessionsService.invalidateAllUserSessions(targetUserId);

    await this.adminLogsService.createLog({
      actorId: currentUser.id,
      action: 'MFA_RESET_BY_ADMIN',
      resource: 'user',
      resourceId: targetUserId,
      metadata: {},
    });

    await this.securityEventsService.recordEvent({
      eventType: 'MFA_RESET_BY_ADMIN',
      severity: 'WARNING',
      actorId: currentUser.id,
      targetUserId,
      ipAddress,
      userAgent,
      details: { action: 'mfa_reset_by_admin' },
      status: 'SUCCESS',
    });

    return {
      success: true,
      message: 'MFA has been reset. Temporary recovery codes generated.',
      temporaryRecoveryCodes: newRecoveryCodes,
    };
  }

  /**
   * Helper: Count total active Super Admin accounts in the system.
   */
  private async countActiveSuperAdmins(): Promise<number> {
    const count = await this.prisma.user.count({
      where: {
        status: 'active',
        deletedAt: null,
        OR: [
          { role: { slug: 'super_admin' } },
          { userRoles: { some: { role: { slug: 'super_admin' } } } },
        ],
      },
    });
    return count;
  }
}

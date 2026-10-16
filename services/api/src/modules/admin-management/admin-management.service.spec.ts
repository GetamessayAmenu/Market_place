import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminManagementService } from './admin-management.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { SecurityEventsService } from '../security-events/security-events.service';
import { AuthorizationService } from '../authorization/authorization.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('AdminManagementService', () => {
  let service: AdminManagementService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    adminProfile: {
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockSessionsService = {
    getUserSessionCount: jest.fn().mockResolvedValue(2),
    getUserSessions: jest.fn().mockResolvedValue([]),
    invalidateAllUserSessions: jest.fn().mockResolvedValue(undefined),
  };

  const mockAdminLogsService = {
    createLog: jest.fn().mockResolvedValue(undefined),
  };

  const mockSecurityEventsService = {
    recordEvent: jest.fn().mockResolvedValue(undefined),
    findEvents: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  };

  const mockAuthorizationService = {
    invalidateUserPermissions: jest.fn().mockResolvedValue(undefined),
    isSuperAdmin: jest.fn((u) => Boolean(u.isSuperAdmin || u.role === 'super_admin')),
    can: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminManagementService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SessionsService, useValue: mockSessionsService },
        { provide: AdminLogsService, useValue: mockAdminLogsService },
        { provide: SecurityEventsService, useValue: mockSecurityEventsService },
        { provide: AuthorizationService, useValue: mockAuthorizationService },
      ],
    }).compile();

    service = module.get<AdminManagementService>(AdminManagementService);
    jest.clearAllMocks();
  });

  const superAdminUser: AuthenticatedUser = {
    id: 'super-admin-1',
    email: 'super@habesha.com',
    role: 'super_admin' as any,
    roles: ['super_admin'],
    isSuperAdmin: true,
    displayName: 'Super Admin',
    avatarUrl: null,
    emailVerified: true,
    phoneVerified: true,
  };

  const platformAdminUser: AuthenticatedUser = {
    id: 'platform-admin-1',
    email: 'platform@habesha.com',
    role: 'platform_admin' as any,
    roles: ['platform_admin'],
    isSuperAdmin: false,
    displayName: 'Platform Admin',
    avatarUrl: null,
    emailVerified: true,
    phoneVerified: true,
  };

  describe('createAdmin', () => {
    it('blocks non-super admin from assigning super_admin role and logs security event', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-super', slug: 'super_admin' });

      await expect(
        service.createAdmin(platformAdminUser, {
          email: 'newsuper@habesha.com',
          displayName: 'New Super',
          password: 'Password123!',
          roleSlug: 'super_admin',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockSecurityEventsService.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
          severity: 'CRITICAL',
          status: 'BLOCKED',
        }),
      );
    });

    it('allows Super Admin to assign super_admin role', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-super', slug: 'super_admin' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-super-id',
        email: 'newsuper@habesha.com',
        displayName: 'New Super',
        roleId: 'role-super',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'new-super-id',
        email: 'newsuper@habesha.com',
        displayName: 'New Super',
        role: { slug: 'super_admin' },
        adminProfile: { mfaEnabled: false, mfaEnforced: true },
        userRoles: [],
        deletedAt: null,
      });

      const result = await service.createAdmin(superAdminUser, {
        email: 'newsuper@habesha.com',
        displayName: 'New Super',
        password: 'Password123!',
        roleSlug: 'super_admin',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-super-id');
      expect(mockAdminLogsService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ADMIN_USER_CREATED',
          resource: 'user',
        }),
      );
    });
  });

  describe('updateAdminRole', () => {
    it('blocks non-super admin from assigning super_admin role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-1',
        deletedAt: null,
        role: { slug: 'platform_admin' },
        userRoles: [],
      });

      await expect(
        service.updateAdminRole(platformAdminUser, 'target-1', {
          roleSlug: 'super_admin',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockSecurityEventsService.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
          status: 'BLOCKED',
        }),
      );
    });

    it('prevents removing the last active Super Admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-super',
        deletedAt: null,
        role: { slug: 'super_admin' },
        userRoles: [],
      });
      // Only 1 active super admin in the system
      mockPrisma.user.count.mockResolvedValue(1);

      await expect(
        service.updateAdminRole(superAdminUser, 'target-super', {
          roleSlug: 'platform_admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('suspendAdmin', () => {
    it('prevents an admin from suspending themselves', async () => {
      await expect(
        service.suspendAdmin(superAdminUser, superAdminUser.id, { reason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents suspending the last remaining Super Admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-super',
        deletedAt: null,
        role: { slug: 'super_admin' },
        userRoles: [],
      });
      mockPrisma.user.count.mockResolvedValue(1);

      await expect(
        service.suspendAdmin(superAdminUser, 'target-super', { reason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('suspending an admin revokes active sessions and updates status to suspended', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'target-mod',
        deletedAt: null,
        role: { slug: 'moderator' },
        userRoles: [],
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'target-mod', status: 'suspended' });

      const res = await service.suspendAdmin(superAdminUser, 'target-mod', {
        reason: 'Policy violation',
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'target-mod' },
        data: { status: 'suspended' },
      });
      expect(mockSessionsService.invalidateAllUserSessions).toHaveBeenCalledWith('target-mod');
      expect(mockAuthorizationService.invalidateUserPermissions).toHaveBeenCalledWith('target-mod');
    });
  });
});

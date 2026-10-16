import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
    jest.clearAllMocks();
  });

  describe('isSuperAdmin', () => {
    it('should return true if user.isSuperAdmin is true', () => {
      const user: AuthenticatedUser = {
        id: 'u1',
        email: 'super@habesha.com',
        role: 'admin',
        roles: ['admin'],
        permissions: [],
        isSuperAdmin: true,
        displayName: 'Super Admin',
        avatarUrl: null,
        emailVerified: true,
        phoneVerified: true,
      };
      expect(service.isSuperAdmin(user)).toBe(true);
    });

    it('should return true if user.role is super_admin', () => {
      const user: AuthenticatedUser = {
        id: 'u2',
        email: 'super@habesha.com',
        role: 'super_admin' as any,
        roles: ['super_admin'],
        permissions: [],
        displayName: 'Super Admin',
        avatarUrl: null,
        emailVerified: true,
        phoneVerified: true,
      };
      expect(service.isSuperAdmin(user)).toBe(true);
    });

    it('should return true if user.roles includes super_admin', () => {
      const user: AuthenticatedUser = {
        id: 'u3',
        email: 'super@habesha.com',
        role: 'admin',
        roles: ['admin', 'super_admin'],
        permissions: [],
        displayName: 'Super Admin',
        avatarUrl: null,
        emailVerified: true,
        phoneVerified: true,
      };
      expect(service.isSuperAdmin(user)).toBe(true);
    });

    it('should return false for regular admin or moderator without super_admin', () => {
      const user: AuthenticatedUser = {
        id: 'u4',
        email: 'mod@habesha.com',
        role: 'moderator' as any,
        roles: ['moderator'],
        permissions: [],
        displayName: 'Moderator',
        avatarUrl: null,
        emailVerified: true,
        phoneVerified: true,
      };
      expect(service.isSuperAdmin(user)).toBe(false);
    });
  });

  describe('can', () => {
    it('Super Admin has ALL permissions unrestricted centrally without database check', async () => {
      const superUser: AuthenticatedUser = {
        id: 'super-1',
        email: 'owner@habesha.com',
        role: 'super_admin' as any,
        roles: ['super_admin'],
        isSuperAdmin: true,
        displayName: 'Platform Owner',
        avatarUrl: null,
        emailVerified: true,
        phoneVerified: true,
      };

      expect(await service.can(superUser, 'admins.assign_roles')).toBe(true);
      expect(await service.can(superUser, 'cms.seo.manage')).toBe(true);
      expect(await service.can(superUser, 'settings.manage')).toBe(true);
      expect(await service.can(superUser, 'any_future_permission.manage')).toBe(true);
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('evaluates permissions from user object if present', async () => {
      const modUser: AuthenticatedUser = {
        id: 'mod-1',
        email: 'mod@habesha.com',
        role: 'moderator' as any,
        roles: ['moderator'],
        permissions: ['disputes:view', 'reports:manage'],
        displayName: 'Dispute Moderator',
        avatarUrl: null,
        emailVerified: true,
        phoneVerified: true,
      };

      expect(await service.can(modUser, 'disputes.view')).toBe(true);
      expect(await service.can(modUser, 'reports.manage')).toBe(true);
      expect(await service.can(modUser, 'cms.homepage.manage')).toBe(false);
      expect(await service.can(modUser, 'admins.create')).toBe(false);
    });

    it('normalizes singular and plural resources (e.g. dispute:view and disputes:view)', async () => {
      const user: AuthenticatedUser = {
        id: 'u-5',
        email: 'u5@habesha.com',
        role: 'admin',
        roles: ['admin'],
        permissions: ['dispute:view'],
        displayName: 'Reviewer',
        avatarUrl: null,
        emailVerified: true,
        phoneVerified: true,
      };

      expect(await service.can(user, 'disputes.view')).toBe(true);
      expect(await service.can(user, 'dispute.view')).toBe(true);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { AdminLogsService } from './admin-logs.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditAction, AuditResourceType } from './audit-action.enum';

describe('AdminLogsService', () => {
  let service: AdminLogsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    adminLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLogsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminLogsService>(AdminLogsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('should sanitize metadata and create audit log', async () => {
      const mockLog = {
        id: 'log-123',
        actorId: 'user-1',
        action: AuditAction.LISTING_APPROVED,
        resource: AuditResourceType.LISTING,
        createdAt: new Date(),
      };
      mockPrismaService.adminLog.create.mockResolvedValue(mockLog);

      const result = await service.createLog({
        actorId: 'user-1',
        action: AuditAction.LISTING_APPROVED,
        resource: AuditResourceType.LISTING,
        resourceId: 'listing-99',
        metadata: { password: 'secret', note: 'Approve listing' },
      });

      expect(prisma.adminLog.create).toHaveBeenCalled();
      const callArgs = mockPrismaService.adminLog.create.mock.calls[0][0];
      expect(callArgs.data.metadata).toEqual({ password: '[REDACTED]', note: 'Approve listing' });
      expect(result).toEqual(mockLog);
    });
  });

  describe('findLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockItems = [
        {
          id: 'log-1',
          action: 'LISTING_APPROVED',
          actor: { id: 'user-1', displayName: 'Admin', email: 'admin@test.com' },
        },
      ];
      mockPrismaService.adminLog.findMany.mockResolvedValue(mockItems);
      mockPrismaService.adminLog.count.mockResolvedValue(1);

      const result = await service.findLogs({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockItems);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findLogById', () => {
    it('should throw NotFoundException if log is not found', async () => {
      mockPrismaService.adminLog.findUnique.mockResolvedValue(null);

      await expect(service.findLogById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportLogsCsv', () => {
    it('should format logs as CSV string', async () => {
      mockPrismaService.adminLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          createdAt: new Date('2026-08-29T10:00:00Z'),
          actorId: 'actor-1',
          actor: { email: 'admin@example.com' },
          action: 'LISTING_APPROVED',
          resource: 'LISTING',
          resourceId: 'listing-123',
          status: 'SUCCESS',
          description: 'Approved listing #123',
          ipAddress: '127.0.0.1',
        },
      ]);

      const csv = await service.exportLogsCsv({});

      expect(csv).toContain('ID,Timestamp,Actor ID,Actor Email,Action,Resource,Resource ID,Status,Description,IP Address');
      expect(csv).toContain('log-1');
      expect(csv).toContain('admin@example.com');
      expect(csv).toContain('LISTING_APPROVED');
    });
  });
});

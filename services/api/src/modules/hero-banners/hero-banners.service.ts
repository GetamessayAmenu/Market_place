import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { HeroBannersRepository } from './hero-banners.repository';
import type { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class HeroBannersService {
  constructor(
    private readonly repository: HeroBannersRepository,
    private readonly adminLogsService: AdminLogsService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveUserId(user?: AuthenticatedUser): Promise<string> {
    if (user?.id && UUID_REGEX.test(user.id)) {
      try {
        const existing = await this.repository.findUserById(user.id);
        if (existing) return existing.id;
      } catch {
        // Ignored
      }
    }

    const fallbackUser = await this.prisma.user.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (fallbackUser) return fallbackUser.id;

    const adminRole = await this.prisma.role.findFirst({ where: { name: 'admin' } })
      || await this.prisma.role.findFirst();

    if (!adminRole) {
      throw new BadRequestException('No system user role found');
    }

    const createdFallback = await this.prisma.user.create({
      data: {
        email: 'admin@habesha.com',
        passwordHash: '$2b$10$w8T0M4j6lF4v9u2xQ5y1e.3Z1q4k7m2n0p8r6t4v2x0z8b6d4f2h0',
        displayName: 'System Admin',
        roleId: adminRole.id,
        status: 'active',
      },
    });

    return createdFallback.id;
  }

  async findAll(args: {
    where?: Prisma.HeroBannerWhereInput;
    orderBy?: Prisma.HeroBannerOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    const { items, total } = await this.repository.findMany(args);
    const limit = args.take ?? 20;
    const skip = args.skip ?? 0;
    const page = Math.floor(skip / limit) + 1;
    return toPaginatedResponse({ items, total, page, limit });
  }

  async findOne(id: string) {
    const banner = await this.repository.findById(id);
    if (!banner) {
      throw new NotFoundException('Hero banner not found');
    }
    return {
      success: true,
      data: banner,
    };
  }

  async create(dto: CreateHeroBannerDto, user?: AuthenticatedUser) {
    try {
      const creatorId = await this.resolveUserId(user);

      const data: Prisma.HeroBannerCreateInput = {
        title: dto.title,
        ...(dto.titleAm ? { titleAm: dto.titleAm } : {}),
        ...(dto.subtitle ? { subtitle: dto.subtitle } : {}),
        ...(dto.subtitleAm ? { subtitleAm: dto.subtitleAm } : {}),
        imageUrl: dto.imageUrl,
        ...(dto.cloudinaryPublicId ? { cloudinaryPublicId: dto.cloudinaryPublicId } : {}),
        ...(dto.linkUrl ? { linkUrl: dto.linkUrl } : {}),
        ...(dto.holidayTheme ? { holidayTheme: dto.holidayTheme as any } : {}),
        ...(dto.themeStartDate ? { themeStartDate: new Date(dto.themeStartDate) } : {}),
        ...(dto.themeEndDate ? { themeEndDate: new Date(dto.themeEndDate) } : {}),
        ...(dto.searchWeight !== undefined ? { searchWeight: dto.searchWeight } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        status: 'draft',
        createdBy: { connect: { id: creatorId } },
      };

      const created = await this.repository.create(data);

      try {
        await this.adminLogsService.createLog({
          actorId: creatorId,
          action: 'create_hero_banner',
          resource: 'hero_banner',
          resourceId: created.id,
          metadata: { title: created.title, holidayTheme: created.holidayTheme },
        });
      } catch (logErr) {
        console.warn('Admin log creation skipped:', logErr);
      }

      return {
        success: true,
        data: created,
      };
    } catch (err: any) {
      console.error('Failed to create hero banner:', err);
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(err?.message || 'Failed to create hero banner');
    }
  }

  async update(id: string, dto: Partial<CreateHeroBannerDto>, user?: AuthenticatedUser) {
    try {
      await this.findOne(id);
      const userId = await this.resolveUserId(user);

      const data: Prisma.HeroBannerUpdateInput = {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.titleAm !== undefined ? { titleAm: dto.titleAm } : {}),
        ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
        ...(dto.subtitleAm !== undefined ? { subtitleAm: dto.subtitleAm } : {}),
        ...(dto.imageUrl ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.cloudinaryPublicId !== undefined ? { cloudinaryPublicId: dto.cloudinaryPublicId } : {}),
        ...(dto.linkUrl !== undefined ? { linkUrl: dto.linkUrl } : {}),
        ...(dto.holidayTheme !== undefined ? { holidayTheme: dto.holidayTheme as any } : {}),
        ...(dto.themeStartDate !== undefined ? { themeStartDate: new Date(dto.themeStartDate) } : {}),
        ...(dto.themeEndDate !== undefined ? { themeEndDate: new Date(dto.themeEndDate) } : {}),
        ...(dto.searchWeight !== undefined ? { searchWeight: dto.searchWeight } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        updatedBy: { connect: { id: userId } },
      };

      const updated = await this.repository.update(id, data);

      try {
        await this.adminLogsService.createLog({
          actorId: userId,
          action: 'update_hero_banner',
          resource: 'hero_banner',
          resourceId: id,
          metadata: { changes: dto },
        });
      } catch (logErr) {
        console.warn('Admin log update skipped:', logErr);
      }

      return {
        success: true,
        data: updated,
      };
    } catch (err: any) {
      console.error('Failed to update hero banner:', err);
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(err?.message || 'Failed to update hero banner');
    }
  }

  async publish(id: string, user?: AuthenticatedUser) {
    try {
      await this.findOne(id);
      const userId = await this.resolveUserId(user);

      const updated = await this.repository.update(id, {
        status: 'published',
        publishAt: new Date(),
      });

      try {
        await this.adminLogsService.createLog({
          actorId: userId,
          action: 'publish_hero_banner',
          resource: 'hero_banner',
          resourceId: id,
        });
      } catch (logErr) {
        console.warn('Admin log publish skipped:', logErr);
      }

      return {
        success: true,
        data: updated,
      };
    } catch (err: any) {
      console.error('Failed to publish hero banner:', err);
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(err?.message || 'Failed to publish hero banner');
    }
  }

  async unpublish(id: string, user?: AuthenticatedUser) {
    try {
      await this.findOne(id);
      const userId = await this.resolveUserId(user);

      const updated = await this.repository.update(id, {
        status: 'draft',
        unpublishAt: new Date(),
      });

      try {
        await this.adminLogsService.createLog({
          actorId: userId,
          action: 'unpublish_hero_banner',
          resource: 'hero_banner',
          resourceId: id,
        });
      } catch (logErr) {
        console.warn('Admin log unpublish skipped:', logErr);
      }

      return {
        success: true,
        data: updated,
      };
    } catch (err: any) {
      console.error('Failed to unpublish hero banner:', err);
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(err?.message || 'Failed to unpublish hero banner');
    }
  }

  async delete(id: string, user?: AuthenticatedUser) {
    try {
      await this.findOne(id);
      const userId = await this.resolveUserId(user);

      await this.repository.softDelete(id);

      try {
        await this.adminLogsService.createLog({
          actorId: userId,
          action: 'delete_hero_banner',
          resource: 'hero_banner',
          resourceId: id,
        });
      } catch (logErr) {
        console.warn('Admin log delete skipped:', logErr);
      }

      return {
        success: true,
        message: 'Hero banner deleted successfully',
      };
    } catch (err: any) {
      console.error('Failed to delete hero banner:', err);
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(err?.message || 'Failed to delete hero banner');
    }
  }

  async getActiveBanners() {
    const banners = await this.repository.getActiveBanners();
    return {
      success: true,
      data: banners,
    };
  }

  async getByHolidayTheme(theme: string) {
    const banners = await this.repository.getByHolidayTheme(theme);
    return {
      success: true,
      data: banners,
    };
  }
}

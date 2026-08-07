import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { HeroBannersRepository } from './hero-banners.repository';
import type { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class HeroBannersService {
  constructor(
    private readonly repository: HeroBannersRepository,
    private readonly adminLogsService: AdminLogsService,
  ) {}

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

  async create(dto: CreateHeroBannerDto, user: AuthenticatedUser) {
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
      createdBy: { connect: { id: user.id } },
    };

    const created = await this.repository.create(data);

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'create_hero_banner',
        resource: 'hero_banner',
        resourceId: created.id,
        metadata: { title: created.title, holidayTheme: created.holidayTheme },
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: created,
    };
  }

  async update(id: string, dto: Partial<CreateHeroBannerDto>, user: AuthenticatedUser) {
    await this.findOne(id);

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
      updatedBy: { connect: { id: user.id } },
    };

    const updated = await this.repository.update(id, data);

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'update_hero_banner',
        resource: 'hero_banner',
        resourceId: id,
        metadata: { changes: dto },
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  async publish(id: string, user: AuthenticatedUser) {
    await this.findOne(id);

    const updated = await this.repository.update(id, {
      status: 'published',
      publishAt: new Date(),
    });

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'publish_hero_banner',
        resource: 'hero_banner',
        resourceId: id,
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  async unpublish(id: string, user: AuthenticatedUser) {
    await this.findOne(id);

    const updated = await this.repository.update(id, {
      status: 'draft',
      unpublishAt: new Date(),
    });

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'unpublish_hero_banner',
        resource: 'hero_banner',
        resourceId: id,
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      data: updated,
    };
  }

  async delete(id: string, user: AuthenticatedUser) {
    await this.findOne(id);

    await this.repository.softDelete(id);

    // Log action
    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'delete_hero_banner',
        resource: 'hero_banner',
        resourceId: id,
      });
    } catch {
      // non-fatal
    }

    return {
      success: true,
      message: 'Hero banner deleted successfully',
    };
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

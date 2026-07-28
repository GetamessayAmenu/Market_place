import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { HomepageContentRepository } from './homepage-content.repository';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { UploadsService } from '../uploads/uploads.service';
import type { CreateHomepageContentDto } from './dto/create-homepage-content.dto';
import type { UpdateHomepageContentDto } from './dto/update-homepage-content.dto';
import type { HomepageContentQueryDto } from './dto/homepage-content-query.dto';
import type { ReorderHomepageContentDto } from './dto/reorder-homepage-content.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';
import type { CmsSchedulingJobData } from './processors/cms-scheduling.processor';

@Injectable()
export class HomepageContentService {
  constructor(
    private readonly repository: HomepageContentRepository,
    private readonly adminLogsService: AdminLogsService,
    private readonly uploadsService: UploadsService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.CMS_SCHEDULING) private readonly cmsQueue: Queue<CmsSchedulingJobData>,
  ) {}

  async findAll(query: HomepageContentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.HomepageContentWhereInput = {
      deletedAt: null,
      ...(query.type ? { type: query.type as any } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { subtitle: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.HomepageContentOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder || 'asc' }
      : { sortOrder: 'asc' };

    const [items, total] = await Promise.all([
      this.repository.findMany({ where, orderBy, skip, take: limit }),
      this.repository.count(where),
    ]);

    return {
      success: true,
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item || item.deletedAt) {
      throw new NotFoundException('Homepage content not found');
    }
    return {
      success: true,
      data: item,
    };
  }

  async create(dto: CreateHomepageContentDto, admin: AuthenticatedUser) {
    const data: Prisma.HomepageContentCreateInput = {
      type: dto.type as any,
      title: dto.title,
      ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.cloudinaryPublicId !== undefined ? { cloudinaryPublicId: dto.cloudinaryPublicId } : {}),
      ...(dto.linkUrl !== undefined ? { linkUrl: dto.linkUrl } : {}),
      ...(dto.linkLabel !== undefined ? { linkLabel: dto.linkLabel } : {}),
      ...(dto.buttonText !== undefined ? { buttonText: dto.buttonText } : {}),
      ...(dto.backgroundColor !== undefined ? { backgroundColor: dto.backgroundColor } : {}),
      ...(dto.textColor !== undefined ? { textColor: dto.textColor } : {}),
      status: dto.status as any,
      sortOrder: dto.sortOrder ?? 0,
      ...(dto.publishAt !== undefined ? { publishAt: new Date(dto.publishAt) } : {}),
      ...(dto.unpublishAt !== undefined ? { unpublishAt: new Date(dto.unpublishAt) } : {}),
      ...(dto.featuredListingId !== undefined
        ? { featuredListing: { connect: { id: dto.featuredListingId } } }
        : {}),
      ...(dto.featuredCategoryId !== undefined
        ? { featuredCategory: { connect: { id: dto.featuredCategoryId } } }
        : {}),
      createdBy: { connect: { id: admin.id } },
    };

    const created = await this.repository.create(data);

    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: 'CREATE_HOMEPAGE_CONTENT',
      resource: 'HomepageContent',
      resourceId: created.id,
      metadata: { type: created.type, title: created.title },
    });

    this.eventEmitter.emit('homepage.content.created', { contentId: created.id, adminId: admin.id });

    // Schedule publish job if publishAt is set
    if (created.publishAt && created.publishAt > new Date()) {
      await this.cmsQueue.add(
        'publish',
        { type: 'publish', contentId: created.id, adminId: admin.id },
        { delay: created.publishAt.getTime() - Date.now() },
      );
    }

    // Schedule unpublish job if unpublishAt is set
    if (created.unpublishAt && created.unpublishAt > new Date()) {
      await this.cmsQueue.add(
        'unpublish',
        { type: 'unpublish', contentId: created.id, adminId: admin.id },
        { delay: created.unpublishAt.getTime() - Date.now() },
      );
    }

    return {
      success: true,
      data: created,
    };
  }

  async update(id: string, dto: UpdateHomepageContentDto, admin: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Homepage content not found');
    }

    const data: Prisma.HomepageContentUpdateInput = {
      ...(dto.type !== undefined ? { type: dto.type as any } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.cloudinaryPublicId !== undefined ? { cloudinaryPublicId: dto.cloudinaryPublicId } : {}),
      ...(dto.linkUrl !== undefined ? { linkUrl: dto.linkUrl } : {}),
      ...(dto.linkLabel !== undefined ? { linkLabel: dto.linkLabel } : {}),
      ...(dto.buttonText !== undefined ? { buttonText: dto.buttonText } : {}),
      ...(dto.backgroundColor !== undefined ? { backgroundColor: dto.backgroundColor } : {}),
      ...(dto.textColor !== undefined ? { textColor: dto.textColor } : {}),
      ...(dto.status !== undefined ? { status: dto.status as any } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.publishAt !== undefined ? { publishAt: new Date(dto.publishAt) } : {}),
      ...(dto.unpublishAt !== undefined ? { unpublishAt: new Date(dto.unpublishAt) } : {}),
      ...(dto.featuredListingId !== undefined
        ? dto.featuredListingId === null
          ? { featuredListing: { disconnect: true } }
          : { featuredListing: { connect: { id: dto.featuredListingId } } }
        : {}),
      ...(dto.featuredCategoryId !== undefined
        ? dto.featuredCategoryId === null
          ? { featuredCategory: { disconnect: true } }
          : { featuredCategory: { connect: { id: dto.featuredCategoryId } } }
        : {}),
      updatedBy: { connect: { id: admin.id } },
    };

    const updated = await this.repository.update(id, data);

    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: 'UPDATE_HOMEPAGE_CONTENT',
      resource: 'HomepageContent',
      resourceId: updated.id,
      metadata: { type: updated.type, title: updated.title },
    });

    this.eventEmitter.emit('homepage.content.updated', { contentId: updated.id, adminId: admin.id });

    // Reschedule publish job if publishAt changed
    if (dto.publishAt !== undefined && updated.publishAt && updated.publishAt > new Date()) {
      await this.cmsQueue.add(
        'publish',
        { type: 'publish', contentId: updated.id, adminId: admin.id },
        { delay: updated.publishAt.getTime() - Date.now() },
      );
    }

    // Reschedule unpublish job if unpublishAt changed
    if (dto.unpublishAt !== undefined && updated.unpublishAt && updated.unpublishAt > new Date()) {
      await this.cmsQueue.add(
        'unpublish',
        { type: 'unpublish', contentId: updated.id, adminId: admin.id },
        { delay: updated.unpublishAt.getTime() - Date.now() },
      );
    }

    return {
      success: true,
      data: updated,
    };
  }

  async remove(id: string, admin: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Homepage content not found');
    }

    if (existing.cloudinaryPublicId) {
      await this.uploadsService.deleteImage(existing.cloudinaryPublicId);
    }

    await this.repository.softDelete(id);

    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: 'DELETE_HOMEPAGE_CONTENT',
      resource: 'HomepageContent',
      resourceId: id,
      metadata: { type: existing.type, title: existing.title },
    });

    this.eventEmitter.emit('homepage.content.deleted', { contentId: id, adminId: admin.id });

    return {
      success: true,
      message: 'Homepage content deleted successfully',
    };
  }

  async restore(id: string, admin: AuthenticatedUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Homepage content not found');
    }

    await this.repository.restore(id);

    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: 'RESTORE_HOMEPAGE_CONTENT',
      resource: 'HomepageContent',
      resourceId: id,
      metadata: { type: existing.type, title: existing.title },
    });

    this.eventEmitter.emit('homepage.content.restored', { contentId: id, adminId: admin.id });

    return {
      success: true,
      message: 'Homepage content restored successfully',
    };
  }

  async reorder(dto: ReorderHomepageContentDto, admin: AuthenticatedUser) {
    await this.repository.reorderItems(dto.itemIds);

    await this.adminLogsService.createLog({
      actorId: admin.id,
      action: 'REORDER_HOMEPAGE_CONTENT',
      resource: 'HomepageContent',
      resourceId: null,
      metadata: { itemCount: dto.itemIds.length },
    });

    this.eventEmitter.emit('homepage.content.reordered', { itemIds: dto.itemIds, adminId: admin.id });

    return {
      success: true,
      message: 'Homepage content reordered successfully',
    };
  }

  async getPublishedContent() {
    const items = await this.repository.getPublishedContent();
    return {
      success: true,
      data: items,
    };
  }
}

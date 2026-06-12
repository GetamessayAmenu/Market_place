import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LISTING_DEFAULT_TTL_DAYS } from '@marketplace/config';
import type { ListingStatus } from '@marketplace/types';
import { slugifyWithSuffix } from '@marketplace/utils';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { CategoriesService } from '../categories/categories.service';
import { FavoritesService } from '../favorites/favorites.service';
import { UploadsService } from '../uploads/uploads.service';

import { ListingsCacheService } from './cache/listings-cache.service';
import { LISTING_EVENTS } from './constants/listings.constants';
import type { BulkListingActionDto } from './dto/bulk-listing-action.dto';
import { BulkListingAction } from './dto/bulk-listing-action.dto';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { ListingQueryDto } from './dto/listing-query.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';
import {
  ListingCreatedEvent,
  ListingDeletedEvent,
  ListingSpamSuspectedEvent,
  ListingUpdatedEvent,
  ListingViewedEvent,
} from './events/listing.events';
import {
  InvalidListingStatusTransitionException,
  ListingForbiddenException,
  ListingNotFoundException,
} from './exceptions/listing.exceptions';
import type { ListingWithRelations } from './interfaces/listing-with-relations.interface';
import { ListingsRepository } from './listings.repository';
import {
  canModerateListings,
  canSetListingStatus,
  isPublicListingStatus,
} from './policies/listing.policies';
import { serializeListing, serializeListingSummary } from './serializers/listing.serializer';
import { buildListingOrderBy, buildListingWhere } from './utils/listing-query.util';

@Injectable()
export class ListingsService {
  constructor(
    private readonly listingsRepository: ListingsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly uploadsService: UploadsService,
    private readonly favoritesService: FavoritesService,
    private readonly listingsCacheService: ListingsCacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateListingDto) {
    await this.categoriesService.assertCategoryExists(dto.categoryId);
    this.validateImages(dto.images);

    const slug = await this.generateUniqueSlug(dto.title);
    const now = new Date();
    const expiresAt = this.addDays(now, LISTING_DEFAULT_TTL_DAYS);
    const status: ListingStatus = 'pending_review';

    const listing = await this.listingsRepository.createWithImages({
      sellerId: user.id,
      categoryId: dto.categoryId,
      title: dto.title,
      slug,
      description: dto.description,
      price: new Prisma.Decimal(dto.price),
      currency: dto.currency ?? 'USD',
      condition: dto.condition,
      status,
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
      ...(dto.latitude !== undefined
        ? { latitude: new Prisma.Decimal(dto.latitude) }
        : {}),
      ...(dto.longitude !== undefined
        ? { longitude: new Prisma.Decimal(dto.longitude) }
        : {}),
      ...(dto.contactOptions !== undefined
        ? { contactOptions: dto.contactOptions as Prisma.InputJsonValue }
        : {}),
      publishedAt: now,
      expiresAt,
      images: this.normalizeImages(dto.images),
    });

    await this.listingsCacheService.invalidateAllForListing(listing.categoryId);
    this.eventEmitter.emit(
      LISTING_EVENTS.CREATED,
      new ListingCreatedEvent(listing.id, user.id),
    );
    this.flagSpamIfNeeded(listing.id, user.id, dto.description);

    return serializeListing(listing);
  }

  async findAllAdmin(query: ListingQueryDto, admin: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildListingWhere(query, { publicOnly: false });
    const result = await this.listingsRepository.findManyWithRelations({
      where,
      orderBy: buildListingOrderBy(query.sortBy),
      page,
      limit,
    });

    const favoritedIds = new Set(
      await this.favoritesService.getFavoritedIds(
        admin.id,
        result.items.map((l) => l.id),
      ),
    );

    return toPaginatedResponse({
      ...result,
      items: result.items.map((l) => {
        const summary = serializeListingSummary(l);
        return { ...summary, isFavorited: favoritedIds.has(l.id) };
      }),
    });
  }

  async findAll(query: ListingQueryDto, viewer?: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildListingWhere(query, { publicOnly: true });
    const result = await this.listingsRepository.findManyWithRelations({
      where,
      orderBy: buildListingOrderBy(query.sortBy),
      page,
      limit,
    });

    const favoritedIds = viewer
      ? new Set(
          await this.favoritesService.getFavoritedIds(
            viewer.id,
            result.items.map((l) => l.id),
          ),
        )
      : null;

    return toPaginatedResponse({
      ...result,
      items: result.items.map((l) => {
        const summary = serializeListingSummary(l);
        if (favoritedIds) {
          return { ...summary, isFavorited: favoritedIds.has(l.id) };
        }
        return summary;
      }),
    });
  }

  async findOne(id: string, viewer?: AuthenticatedUser) {
    const listing = await this.listingsRepository.findByIdWithRelations(id);
    if (!listing || listing.deletedAt) {
      throw new ListingNotFoundException();
    }

    const isOwner = viewer?.id === listing.sellerId;
    const canModerate = viewer ? canModerateListings(viewer) : false;
    if (!isPublicListingStatus(listing.status) && !isOwner && !canModerate) {
      throw new ListingNotFoundException();
    }

    if (isPublicListingStatus(listing.status)) {
      await this.listingsRepository.incrementViewCount(id);
      this.eventEmitter.emit(
        LISTING_EVENTS.VIEWED,
        new ListingViewedEvent(id, viewer?.id),
      );
    }

    if (viewer) {
      const isFavorited = await this.favoritesService.isFavorited(viewer.id, id);
      return serializeListing(listing, { isFavorited });
    }

    return serializeListing(listing);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateListingDto) {
    const existing = await this.listingsRepository.findByIdWithRelations(id);
    if (!existing || existing.deletedAt) {
      throw new ListingNotFoundException();
    }

    if (dto.categoryId) {
      await this.categoriesService.assertCategoryExists(dto.categoryId);
    }

    if (dto.images) {
      this.validateImages(dto.images);
    }

    if (dto.status && !canSetListingStatus(user, existing.sellerId, dto.status)) {
      throw new InvalidListingStatusTransitionException(existing.status, dto.status);
    }

    const updateData: Prisma.ListingUpdateInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price) } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      ...(dto.categoryId !== undefined
        ? { category: { connect: { id: dto.categoryId } } }
        : {}),
      ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
      ...(dto.latitude !== undefined
        ? { latitude: new Prisma.Decimal(dto.latitude) }
        : {}),
      ...(dto.longitude !== undefined
        ? { longitude: new Prisma.Decimal(dto.longitude) }
        : {}),
      ...(dto.contactOptions !== undefined
        ? { contactOptions: dto.contactOptions as Prisma.InputJsonValue }
        : {}),
      ...(dto.isFeatured !== undefined && canModerateListings(user)
        ? { isFeatured: dto.isFeatured }
        : {}),
    };

    if (dto.status) {
      Object.assign(updateData, this.applyStatusChange(dto.status, existing));
    }

    if (dto.title && dto.title !== existing.title) {
      updateData.slug = await this.generateUniqueSlug(dto.title, id);
    }

    let listing: ListingWithRelations;
    if (dto.images) {
      if (Object.keys(updateData).length > 0) {
        await this.listingsRepository.updateListing(id, updateData);
      }
      const oldIds = await this.listingsRepository.getImagePublicIds(id);
      await this.listingsRepository.replaceImages(id, this.normalizeImages(dto.images));
      const newIds = dto.images.map((i) => i.cloudinaryPublicId);
      const toDelete = oldIds.filter((pid) => !newIds.includes(pid));
      await this.uploadsService.deleteImages(toDelete);
      listing = (await this.listingsRepository.findByIdWithRelations(id))!;
    } else {
      listing = await this.listingsRepository.updateListing(id, updateData);
    }

    await this.listingsCacheService.invalidateAllForListing(listing.categoryId);
    this.eventEmitter.emit(
      LISTING_EVENTS.UPDATED,
      new ListingUpdatedEvent(listing.id, listing.sellerId),
    );

    if (dto.status && canModerateListings(user)) {
      const actionMap: Record<string, string> = {
        active: 'listing.approved',
        rejected: 'listing.rejected',
        archived: 'listing.archived',
        sold: 'listing.marked_sold',
      };
      const action = actionMap[dto.status] ?? `listing.status_changed:${dto.status}`;
      await this.adminLogsService.createLog({
        actorId: user.id,
        action,
        resource: 'listing',
        resourceId: listing.id,
        metadata: { newStatus: dto.status },
      });
    }

    return serializeListing(listing);
  }

  async softDelete(user: AuthenticatedUser, id: string) {
    const existing = await this.listingsRepository.findByIdRaw(id);
    if (!existing || existing.deletedAt) {
      throw new ListingNotFoundException();
    }
    if (existing.sellerId !== user.id && !canModerateListings(user)) {
      throw new ListingForbiddenException();
    }

    const listing = await this.listingsRepository.softDelete(id);
    const publicIds = await this.listingsRepository.getImagePublicIds(id);
    await this.uploadsService.deleteImages(publicIds);
    await this.listingsCacheService.invalidateAllForListing(listing.categoryId);
    this.eventEmitter.emit(
      LISTING_EVENTS.DELETED,
      new ListingDeletedEvent(id, existing.sellerId),
    );
    if (existing.sellerId !== user.id && canModerateListings(user)) {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'listing.soft_deleted',
        resource: 'listing',
        resourceId: id,
        metadata: { sellerId: existing.sellerId },
      });
    }
    return { deleted: true, soft: true };
  }

  async hardDelete(user: AuthenticatedUser, id: string) {
    const existing = await this.listingsRepository.findByIdRaw(id);
    if (!existing) {
      throw new ListingNotFoundException();
    }
    if (existing.sellerId !== user.id && !canModerateListings(user)) {
      throw new ListingForbiddenException();
    }
    const publicIds = await this.listingsRepository.getImagePublicIds(id);
    await this.uploadsService.deleteImages(publicIds);
    await this.listingsRepository.hardDelete(id);
    await this.listingsCacheService.invalidateAllForListing(existing.categoryId);
    if (existing.sellerId !== user.id && canModerateListings(user)) {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'listing.hard_deleted',
        resource: 'listing',
        resourceId: id,
        metadata: { sellerId: existing.sellerId },
      });
    }
    return { deleted: true, soft: false };
  }

  async markAsSold(user: AuthenticatedUser, id: string) {
    return this.updateStatus(user, id, 'sold');
  }

  async renew(user: AuthenticatedUser, id: string) {
    const existing = await this.listingsRepository.findByIdRaw(id);
    if (!existing || existing.deletedAt) {
      throw new ListingNotFoundException();
    }
    if (existing.sellerId !== user.id) {
      throw new ListingForbiddenException();
    }

    const now = new Date();
    const listing = await this.listingsRepository.updateListing(id, {
      status: 'active',
      expiresAt: this.addDays(now, LISTING_DEFAULT_TTL_DAYS),
      publishedAt: now,
    });

    await this.listingsCacheService.invalidateAllForListing(listing.categoryId);
    this.eventEmitter.emit(LISTING_EVENTS.RENEWED, { listingId: id, sellerId: user.id });
    return serializeListing(listing);
  }

  async hide(user: AuthenticatedUser, id: string) {
    return this.updateStatus(user, id, 'archived');
  }

  async publish(user: AuthenticatedUser, id: string) {
    return this.updateStatus(user, id, 'active');
  }

  async findBySeller(sellerId: string, query: ListingQueryDto, viewer?: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const isOwner = viewer?.id === sellerId;
    const where = buildListingWhere(query, {
      publicOnly: !isOwner,
      sellerId,
    });

    const result = await this.listingsRepository.findManyWithRelations({
      where,
      orderBy: buildListingOrderBy(query.sortBy),
      page,
      limit,
    });

    return toPaginatedResponse({
      ...result,
      items: result.items.map((l) => serializeListingSummary(l)),
    });
  }

  async bulkAction(dto: BulkListingActionDto, admin: AuthenticatedUser) {
    const statusMap: Record<BulkListingAction, ListingStatus> = {
      [BulkListingAction.approve]: 'active',
      [BulkListingAction.reject]: 'rejected',
      [BulkListingAction.archive]: 'archived',
    };
    const targetStatus = statusMap[dto.action];
    const now = new Date();

    const listings = await this.listingsRepository.findByIds(dto.listingIds);
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const listing of listings) {
      try {
        const updateData: Prisma.ListingUpdateInput = { status: targetStatus };
        if (targetStatus === 'active') {
          updateData.publishedAt = listing.publishedAt ?? now;
          updateData.expiresAt = this.addDays(now, LISTING_DEFAULT_TTL_DAYS);
        }
        if (targetStatus === 'rejected' && dto.reason) {
          updateData.rejectedReason = dto.reason;
        }

        await this.listingsRepository.updateListing(listing.id, updateData);
        await this.listingsCacheService.invalidateAllForListing(listing.categoryId);

        this.eventEmitter.emit(
          LISTING_EVENTS.UPDATED,
          new ListingUpdatedEvent(listing.id, listing.sellerId),
        );

        const actionMap: Record<string, string> = {
          active: 'listing.approved',
          rejected: 'listing.rejected',
          archived: 'listing.archived',
        };
        await this.adminLogsService.createLog({
          actorId: admin.id,
          action: actionMap[targetStatus] ?? `listing.bulk_${dto.action}`,
          resource: 'listing',
          resourceId: listing.id,
          metadata: { newStatus: targetStatus, bulk: true, reason: dto.reason },
        });

        results.push({ id: listing.id, success: true });
      } catch (err) {
        results.push({
          id: listing.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const missing = dto.listingIds.filter(
      (id) => !listings.some((l) => l.id === id),
    );
    for (const id of missing) {
      results.push({ id, success: false, error: 'Listing not found' });
    }

    return {
      processed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  private async updateStatus(
    user: AuthenticatedUser,
    id: string,
    status: ListingStatus,
  ) {
    const existing = await this.listingsRepository.findByIdRaw(id);
    if (!existing || existing.deletedAt) {
      throw new ListingNotFoundException();
    }
    if (!canSetListingStatus(user, existing.sellerId, status)) {
      throw new InvalidListingStatusTransitionException(existing.status, status);
    }

    const listing = await this.listingsRepository.updateListing(
      id,
      this.applyStatusChange(status, existing),
    );
    await this.listingsCacheService.invalidateAllForListing(listing.categoryId);
    if (canModerateListings(user)) {
      const actionMap: Record<string, string> = {
        active: 'listing.approved',
        rejected: 'listing.rejected',
        archived: 'listing.archived',
        sold: 'listing.marked_sold',
      };
      const action = actionMap[status] ?? `listing.status_changed:${status}`;
      await this.adminLogsService.createLog({
        actorId: user.id,
        action,
        resource: 'listing',
        resourceId: id,
        metadata: { newStatus: status },
      });
    }
    if (status === 'sold') {
      this.eventEmitter.emit(LISTING_EVENTS.SOLD, { listingId: id, sellerId: user.id });
    }
    return serializeListing(listing);
  }

  private applyStatusChange(
    status: ListingStatus,
    existing: { readonly status: ListingStatus; readonly publishedAt: Date | null },
  ): Prisma.ListingUpdateInput {
    const data: Prisma.ListingUpdateInput = { status };
    if (status === 'active') {
      const now = new Date();
      data.publishedAt = existing.publishedAt ?? now;
      data.expiresAt = this.addDays(now, LISTING_DEFAULT_TTL_DAYS);
    }
    if (status === 'sold' || status === 'archived') {
      data.expiresAt = null;
    }
    return data;
  }

  private validateImages(
    images: readonly { url: string; cloudinaryPublicId: string }[],
  ): void {
    for (const image of images) {
      if (!image.cloudinaryPublicId.includes('listings')) {
        throw new ListingForbiddenException('Invalid image upload folder');
      }
    }
  }

  private normalizeImages(
    images: readonly {
      url: string;
      cloudinaryPublicId: string;
      sortOrder?: number;
      isPrimary?: boolean;
    }[],
  ) {
    const sorted = images.map((img, index) => ({
      url: img.url,
      cloudinaryPublicId: img.cloudinaryPublicId,
      sortOrder: img.sortOrder ?? index,
      isPrimary: img.isPrimary ?? index === 0,
    }));
    if (!sorted.some((i) => i.isPrimary) && sorted[0]) {
      sorted[0].isPrimary = true;
    }
    return sorted;
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = slugifyWithSuffix(title, randomUUID().slice(0, 8));
    let attempts = 0;
    while (await this.listingsRepository.slugExists(slug, excludeId)) {
      attempts += 1;
      slug = slugifyWithSuffix(title, randomUUID().slice(0, 8));
      if (attempts > 5) {
        break;
      }
    }
    return slug;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private flagSpamIfNeeded(listingId: string, sellerId: string, description: string): void {
    const spamPatterns = [/(.)\1{10,}/i, /(https?:\/\/){5,}/i];
    if (spamPatterns.some((p) => p.test(description))) {
      this.eventEmitter.emit(
        LISTING_EVENTS.SPAM_SUSPECTED,
        new ListingSpamSuspectedEvent(listingId, sellerId),
      );
    }
  }
}

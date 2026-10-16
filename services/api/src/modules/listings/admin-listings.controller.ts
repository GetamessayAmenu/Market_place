import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { BulkListingActionDto } from '../listings/dto/bulk-listing-action.dto';
import { ListingQueryDto } from '../listings/dto/listing-query.dto';
import { ModerationActionDto } from './dto/moderation-action.dto';
import { ListingsService } from '../listings/listings.service';

/**
 * Admin controller for browsing and moderating listings.
 * Allows moderators to see listings in any status (including pending_review).
 */
@Controller('admin/listings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'platform_admin', 'moderator', 'support')
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @RequirePermission('listings.view')
  findAll(@Query() query: ListingQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.listingsService.findAllAdmin(query, user);
  }

  @Get(':id')
  @RequirePermission('listings.view')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.listingsService.findOne(id, user);
  }

  @Post('bulk-action')
  @RequirePermission('listings.approve')
  bulkAction(
    @Body() dto: BulkListingActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.bulkAction(dto, user);
  }

  @Post(':id/approve')
  @RequirePermission('listings.approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'approve', user);
  }

  @Post(':id/reject')
  @RequirePermission('listings.reject')
  reject(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'reject', user, dto);
  }

  @Post(':id/request-changes')
  @RequirePermission('listings.reject')
  requestChanges(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'request_changes', user, dto);
  }

  @Post(':id/hide')
  @RequirePermission('listings.reject')
  hide(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'hide', user);
  }

  @Delete(':id')
  @RequirePermission('listings.delete')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'delete', user);
  }

  @Patch(':id/feature')
  @RequirePermission('listings.feature')
  feature(
    @Param('id') id: string,
    @Body() dto: { featured: boolean },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.setFeatured(id, dto.featured, user);
  }

  @Get('revisions/pending')
  @RequirePermission('listings.view')
  getPendingRevisions(@Query() query: ListingQueryDto) {
    return this.listingsService.getPendingRevisions(query);
  }

  @Get('revisions/:revisionId')
  @RequirePermission('listings.view')
  getRevisionById(@Param('revisionId') revisionId: string) {
    return this.listingsService.getRevisionById(revisionId);
  }

  @Post('revisions/:revisionId/approve')
  @RequirePermission('listings.approve')
  approveRevision(
    @Param('revisionId') revisionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.approveRevision(revisionId, user);
  }

  @Post('revisions/:revisionId/reject')
  @RequirePermission('listings.reject')
  rejectRevision(
    @Param('revisionId') revisionId: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.rejectRevision(revisionId, user, dto.reason);
  }

  @Get(':id/revisions')
  @RequirePermission('listings.view')
  getListingRevisions(@Param('id') id: string) {
    return this.listingsService.getListingRevisions(id);
  }

  @Get(':id/history')
  @RequirePermission('listings.view')
  getHistory(
    @Param('id') id: string,
  ) {
    return this.listingsService.getModerationHistory(id);
  }
}

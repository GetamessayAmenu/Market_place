import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'moderator', 'support')
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(@Query() query: ListingQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.listingsService.findAllAdmin(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.listingsService.findOne(id, user);
  }

  @Post('bulk-action')
  bulkAction(
    @Body() dto: BulkListingActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.bulkAction(dto, user);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'approve', user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'reject', user, dto);
  }

  @Post(':id/request-changes')
  requestChanges(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'request_changes', user, dto);
  }

  @Post(':id/hide')
  hide(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'hide', user);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.moderateListing(id, 'delete', user);
  }

  @Patch(':id/feature')
  feature(
    @Param('id') id: string,
    @Body() dto: { featured: boolean },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.setFeatured(id, dto.featured, user);
  }

  @Get('revisions/pending')
  getPendingRevisions(@Query() query: ListingQueryDto) {
    return this.listingsService.getPendingRevisions(query);
  }

  @Get('revisions/:revisionId')
  getRevisionById(@Param('revisionId') revisionId: string) {
    return this.listingsService.getRevisionById(revisionId);
  }

  @Post('revisions/:revisionId/approve')
  approveRevision(
    @Param('revisionId') revisionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.approveRevision(revisionId, user);
  }

  @Post('revisions/:revisionId/reject')
  rejectRevision(
    @Param('revisionId') revisionId: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingsService.rejectRevision(revisionId, user, dto.reason);
  }

  @Get(':id/revisions')
  getListingRevisions(@Param('id') id: string) {
    return this.listingsService.getListingRevisions(id);
  }

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
  ) {
    return this.listingsService.getModerationHistory(id);
  }
}

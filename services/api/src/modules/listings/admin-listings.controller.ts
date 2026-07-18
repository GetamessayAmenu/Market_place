import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
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
@UseGuards(RolesGuard)
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
    return this.listingsService.moderateListing(id, 'reject', user, dto.reason);
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

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
  ) {
    return this.listingsService.getModerationHistory(id);
  }
}

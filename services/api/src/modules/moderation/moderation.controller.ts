import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import type { BulkModerationActionDto } from './dto/moderation-action.dto';
import type { ModerationActionDto } from './dto/moderation-action.dto';
import type { ModerationQueryDto } from './dto/moderation-query.dto';
import type { ReviewModerationDto } from './dto/moderation-action.dto';
import type { SpamFlagDto } from './dto/moderation-action.dto';
import { ModerationService } from './moderation.service';

/**
 * Admin controller for content moderation.
 * Allows moderators to moderate reviews, images, and other content.
 */
@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'platform_admin', 'moderator', 'support')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  @RequirePermission('reports.view')
  findAll(@Query() query: ModerationQueryDto) {
    return this.moderationService.findAll(query);
  }

  @Get('stats')
  @RequirePermission('reports.view')
  getStats() {
    return this.moderationService.getStats();
  }

  @Get(':id')
  @RequirePermission('reports.view')
  findOne(@Param('id') id: string) {
    return this.moderationService.findOne(id);
  }

  @Get(':id/history')
  @RequirePermission('reports.view')
  getHistory(@Param('id') id: string) {
    return this.moderationService.getModerationHistory(id);
  }

  @Post('bulk-action')
  @RequirePermission('reports.manage')
  bulkAction(
    @Body() dto: BulkModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.bulkAction(dto, user);
  }

  @Post('review/:reviewId')
  @RequirePermission('reports.manage')
  moderateReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: ReviewModerationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateReview(reviewId, dto, user);
  }

  @Post(':id/approve')
  @RequirePermission('reports.manage')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateItem(id, 'approve', user);
  }

  @Post(':id/reject')
  @RequirePermission('reports.manage')
  reject(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateItem(id, 'reject', user, dto.reason);
  }

  @Post(':id/restore')
  @RequirePermission('reports.manage')
  restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateItem(id, 'restore', user);
  }

  @Delete(':id')
  @RequirePermission('reports.manage')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateItem(id, 'delete', user);
  }

  @Patch(':id/spam')
  @RequirePermission('reports.manage')
  toggleSpam(
    @Param('id') id: string,
    @Body() dto: SpamFlagDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.toggleSpamFlag(id, dto, user);
  }
}

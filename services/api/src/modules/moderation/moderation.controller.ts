import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'moderator', 'support')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  findAll(@Query() query: ModerationQueryDto) {
    return this.moderationService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.moderationService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moderationService.findOne(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.moderationService.getModerationHistory(id);
  }

  @Post('bulk-action')
  bulkAction(
    @Body() dto: BulkModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.bulkAction(dto, user);
  }

  @Post('review/:reviewId')
  moderateReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: ReviewModerationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateReview(reviewId, dto, user);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateItem(id, 'approve', user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateItem(id, 'reject', user, dto.reason);
  }

  @Post(':id/restore')
  restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateItem(id, 'restore', user);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.moderateItem(id, 'delete', user);
  }

  @Patch(':id/spam')
  toggleSpam(
    @Param('id') id: string,
    @Body() dto: SpamFlagDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.toggleSpamFlag(id, dto, user);
  }
}

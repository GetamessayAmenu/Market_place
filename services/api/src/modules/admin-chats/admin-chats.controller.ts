import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

import { AdminChatsService } from './admin-chats.service';
import { MessagingRestrictionsService } from './messaging-restrictions.service';
import { MessagingRestrictionType } from '@prisma/client';

@Controller('admin/chats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'moderator', 'support')
export class AdminChatsController {
  constructor(
    private readonly adminChatsService: AdminChatsService,
    private readonly messagingRestrictionsService: MessagingRestrictionsService,
  ) {}

  @Get('metrics')
  getMetrics() {
    return this.adminChatsService.getMetrics();
  }

  @Get('analytics')
  getAnalyticsOverview() {
    return this.adminChatsService.getAnalyticsOverview();
  }

  @Get('search')
  searchConversations(
    @Query('search') search?: string,
    @Query('conversationId') conversationId?: string,
    @Query('userId') userId?: string,
    @Query('listingId') listingId?: string,
    @Query('isFlagged') isFlagged?: string,
    @Query('minRiskScore') minRiskScore?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const opts: Parameters<AdminChatsService['searchConversations']>[0] = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    if (search) opts.search = search;
    if (conversationId) opts.conversationId = conversationId;
    if (userId) opts.userId = userId;
    if (listingId) opts.listingId = listingId;
    if (isFlagged !== undefined) opts.isFlagged = isFlagged === 'true';
    if (minRiskScore) opts.minRiskScore = parseInt(minRiskScore, 10);

    return this.adminChatsService.searchConversations(opts);
  }

  @Get('sellers/:sellerId/analytics')
  getSellerAnalytics(@Param('sellerId') sellerId: string) {
    return this.adminChatsService.getSellerChatAnalytics(sellerId);
  }

  @Get('listings/:listingId/analytics')
  getListingAnalytics(@Param('listingId') listingId: string) {
    return this.adminChatsService.getListingChatAnalytics(listingId);
  }

  @Get('users/:userId/activity')
  getUserChatActivity(@Param('userId') userId: string) {
    return this.adminChatsService.getUserChatActivity(userId);
  }

  @Post('users/:userId/restrict')
  @UseGuards(PermissionsGuard)
  @Permissions({ resource: 'user', action: 'suspend' })
  restrictUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: { type: MessagingRestrictionType; reason: string; expiresAt?: string },
  ) {
    return this.messagingRestrictionsService.createRestriction(
      userId,
      body.type,
      body.reason,
      admin.id,
      body.expiresAt,
    );
  }

  @Delete('users/:userId/restrict/:restrictionId')
  @UseGuards(PermissionsGuard)
  @Permissions({ resource: 'user', action: 'suspend' })
  liftRestriction(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('userId') userId: string,
    @Param('restrictionId') restrictionId: string,
  ) {
    return this.messagingRestrictionsService.removeRestriction(userId, restrictionId, admin.id);
  }

  @Post('messages/:messageId/remove')
  @UseGuards(PermissionsGuard)
  @Permissions({ resource: 'conversation', action: 'moderate' })
  removeMessage(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('messageId') messageId: string,
    @Body() body: { reason: string },
  ) {
    return this.adminChatsService.removeMessage(messageId, admin.id, body.reason);
  }
}

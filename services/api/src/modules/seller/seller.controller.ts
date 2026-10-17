import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { SellerService } from './seller.service';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller', 'admin', 'super_admin')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  // ─── Hub 1: Overview ───────────────────────────────────────────────────────

  @Get('dashboard/kpis')
  getDashboardKpis(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getDashboardKpis(user.id);
  }

  @Get('dashboard/pending-actions')
  getPendingActions(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getPendingActions(user.id);
  }

  @Get('dashboard/engagement-metrics')
  getEngagementMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getEngagementMetrics(user.id);
  }

  @Get('dashboard/promotional-banner')
  getPromotionalBanner(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getPromotionalBanner(user.id);
  }

  // ─── Hub 2: Catalog & Stock Manager ────────────────────────────────────────

  @Get('listings')
  getMyListings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('businessModel') businessModel?: string,
  ) {
    const filters: { status?: string; search?: string; businessModel?: string } = {};
    if (status !== undefined) filters.status = status;
    if (search !== undefined) filters.search = search;
    if (businessModel !== undefined) filters.businessModel = businessModel;
    return this.sellerService.getMyListings(user.id, filters);
  }

  @Patch('listings/:id/status')
  updateListingStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.sellerService.updateListingStatus(user.id, id, status);
  }

  @Get('blackout-dates')
  getBlackoutDates(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getBlackoutDates(user.id);
  }

  @Post('blackout-dates')
  addBlackoutDate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: { startDate: string; endDate: string; reason: string },
  ) {
    return this.sellerService.addBlackoutDate(user.id, data);
  }

  @Patch('blackout-dates/:id')
  updateBlackoutDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() data: { startDate?: string; endDate?: string; reason?: string },
  ) {
    return this.sellerService.updateBlackoutDate(user.id, id, data);
  }

  @Patch('blackout-dates/:id/delete')
  deleteBlackoutDate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sellerService.deleteBlackoutDate(user.id, id);
  }

  // ─── Hub 3: Orders & Requests Pipeline ─────────────────────────────────────

  @Get('orders')
  getMyOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('model') model?: string,
    @Query('status') status?: string,
  ) {
    const filters: { model?: string; status?: string } = {};
    if (model !== undefined) filters.model = model;
    if (status !== undefined) filters.status = status;
    return this.sellerService.getMyOrders(user.id, filters);
  }

  @Get('orders/:id')
  getOrderDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.sellerService.getOrderDetail(user.id, id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.sellerService.updateOrderStatus(user.id, id, status);
  }

  @Patch('orders/:id/milestone')
  updateCustomMilestone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('milestone') milestone: string,
  ) {
    return this.sellerService.updateCustomMilestone(user.id, id, milestone);
  }

  // ─── Hub 4: Direct Communication Center ────────────────────────────────────

  @Get('conversations')
  getConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('filter') filter?: 'all' | 'unread' | 'with_order',
  ) {
    return this.sellerService.getConversations(user.id, filter);
  }

  @Get('conversations/:id/messages')
  getConversationMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.sellerService.getConversationMessages(user.id, id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.sellerService.sendMessage(user.id, id, content);
  }

  @Patch('conversations/:id/read')
  markConversationRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.sellerService.markConversationRead(user.id, id);
  }

  // ─── Hub 5: Store & Profile Manager ───────────────────────────────────────

  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: {
      displayName?: string;
      phone?: string;
      location?: {
        subCity?: string;
        regionalHub?: string;
        address?: string;
      };
    },
  ) {
    return this.sellerService.updateProfile(user.id, data);
  }

  @Get('verification-status')
  getVerificationStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getVerificationStatus(user.id);
  }

  @Post('verification-documents')
  submitVerificationDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: {
      businessLicense?: string;
      tin?: string;
      artisanCertificate?: string;
    },
  ) {
    return this.sellerService.submitVerificationDocuments(user.id, data);
  }

  @Get('promotions')
  getPromotions(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getPromotions(user.id);
  }

  @Patch('promotions')
  updatePromotions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: {
      pinnedListings?: string[];
      bannerText?: string;
    },
  ) {
    return this.sellerService.updatePromotions(user.id, data);
  }

  // ─── Store Follow Feature ───────────────────────────────────────────────────

  @Post('followers')
  getFollowers(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getFollowers(user.id);
  }

  // ─── Hub 6: Insights & Customer Feedback ───────────────────────────────────

  @Get('analytics')
  getAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period: string = '30d',
  ) {
    return this.sellerService.getAnalytics(user.id, period);
  }

  @Get('deposits')
  getDeposits(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerService.getDeposits(user.id);
  }

  @Post('deposits')
  addDeposit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: {
      type: 'held' | 'refunded';
      amount: number;
      customerName: string;
      relatedOrder: string;
      notes?: string;
    },
  ) {
    return this.sellerService.addDeposit(user.id, data);
  }

  @Get('reviews')
  getReviews(
    @CurrentUser() user: AuthenticatedUser,
    @Query('rating') rating?: number,
    @Query('listingId') listingId?: string,
  ) {
    const filters: { rating?: number; listingId?: string } = {};
    if (rating !== undefined) filters.rating = rating;
    if (listingId !== undefined) filters.listingId = listingId;
    return this.sellerService.getReviews(user.id, filters);
  }

  @Post('reviews/:id/response')
  respondToReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('response') response: string,
  ) {
    return this.sellerService.respondToReview(user.id, id, response);
  }

  @Get('customers')
  getCustomers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
  ) {
    return this.sellerService.getCustomers(user.id, search);
  }

  @Get('customers/:id')
  getCustomerDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.sellerService.getCustomerDetail(user.id, id);
  }

  @Patch('customers/:id/measurements')
  updateCustomerMeasurements(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('measurements') measurements: Record<string, number>,
  ) {
    return this.sellerService.updateCustomerMeasurements(user.id, id, measurements);
  }
}

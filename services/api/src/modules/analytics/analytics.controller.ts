import { Controller, Get, Post, Body, Query, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';

import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { RecordEventDto } from './dto/record-event.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'platform_admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @RequirePermission('analytics.view')
  getOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOverviewStats(query);
  }

  // Backward compatibility alias for legacy dashboard endpoint
  @Get('dashboard')
  @RequirePermission('analytics.view')
  getDashboard(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOverviewStats(query);
  }

  @Get('buyers')
  @RequirePermission('analytics.view')
  getBuyers(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getBuyerAnalytics(query);
  }

  @Get('sellers')
  @RequirePermission('analytics.view')
  getSellers(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSellerAnalytics(query);
  }

  @Get('listings')
  @RequirePermission('analytics.view')
  getListings(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getListingAnalytics(query);
  }

  @Get('marketplace')
  @RequirePermission('analytics.view')
  getMarketplaceHealth(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getMarketplaceHealth(query);
  }

  @Get('search')
  @RequirePermission('analytics.view')
  getSearchAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSearchAnalytics(query);
  }

  @Get('communication')
  @RequirePermission('analytics.view')
  getCommunicationAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCommunicationAnalytics(query);
  }

  @Get('orders')
  @RequirePermission('analytics.view')
  getOrderAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOrderAnalytics(query);
  }

  @Get('reports')
  @RequirePermission('analytics.view')
  getReports(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getReportData(query);
  }

  @Get('reports/export')
  @RequirePermission('analytics.export')
  async exportReport(@Query() query: AnalyticsQueryDto, @Res() res: Response) {
    const data = await this.analyticsService.getReportData({ ...query, format: 'csv' });
    if ('csv' in data) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
      return res.send(data.csv);
    }
    return res.json(data);
  }

  @Public()
  @Post('event')
  recordEvent(@Body() dto: RecordEventDto) {
    return this.analyticsService.recordEvent(dto);
  }

  // Legacy helper endpoints
  @Get('listings-by-status')
  async getListingsByStatus() {
    const listingsData = await this.analyticsService.getListingAnalytics({});
    return listingsData.metrics;
  }

  @Get('users-by-status')
  async getUsersByStatus() {
    const overviewData = await this.analyticsService.getOverviewStats({});
    return overviewData.kpis;
  }

  @Get('top-categories')
  async getTopCategories() {
    const listingsData = await this.analyticsService.getListingAnalytics({});
    return listingsData.categoryBreakdown;
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AnalyticsService } from './analytics.service';
import type { AnalyticsRangeDto } from './dto/analytics-range.dto';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@Query() query: AnalyticsRangeDto) {
    return this.analyticsService.getDashboardStats(query);
  }

  @Get('listings-by-status')
  getListingsByStatus() {
    return this.analyticsService.getListingsByStatus();
  }

  @Get('users-by-status')
  getUsersByStatus() {
    return this.analyticsService.getUsersByStatus();
  }

  @Get('top-categories')
  getTopCategories() {
    return this.analyticsService.getTopCategories();
  }
}

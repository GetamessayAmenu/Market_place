import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('overview')
  getOverview(
    @Query() query: DashboardQueryDto,
    @CurrentUser() user?: { id: string },
  ) {
    return this.dashboardService.getOverview(query, user?.id);
  }

  @Get('activity')
  getActivityData(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getActivityData(query);
  }

  @Get('system-health')
  getSystemHealth() {
    return this.dashboardService.getSystemHealth();
  }

  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: number) {
    const parsedLimit = limit ? Math.min(Math.max(Number(limit), 1), 50) : 10;
    return this.dashboardService.getRecentActivity(parsedLimit);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'platform_admin', 'moderator', 'support')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('overview')
  @RequirePermission('analytics.view')
  getOverview(
    @Query() query: DashboardQueryDto,
    @CurrentUser() user?: { id: string },
  ) {
    return this.dashboardService.getOverview(query, user?.id);
  }

  @Get('activity')
  @RequirePermission('analytics.view')
  getActivityData(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getActivityData(query);
  }

  @Get('system-health')
  @RequirePermission('settings.view')
  getSystemHealth() {
    return this.dashboardService.getSystemHealth();
  }

  @Get('recent-activity')
  @RequirePermission('audit_logs.view')
  getRecentActivity(@Query('limit') limit?: number) {
    const parsedLimit = limit ? Math.min(Math.max(Number(limit), 1), 50) : 10;
    return this.dashboardService.getRecentActivity(parsedLimit);
  }
}

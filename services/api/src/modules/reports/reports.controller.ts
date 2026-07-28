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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ResolveReportDto, UpdateReportStatusDto } from './dto/resolve-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Authenticated users can file reports */
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(user, dto);
  }

  /** Users can view their own reports; admins see all */
  @Get('mine')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportQueryDto,
  ) {
    const scoped = Object.assign(new ReportQueryDto(), query, { reporterId: user.id });
    return this.reportsService.findAll(scoped);
  }

  /** Admin/moderator: list all reports with filters */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator', 'support')
  @Get()
  findAll(@Query() query: ReportQueryDto) {
    return this.reportsService.findAll(query);
  }

  /** Admin/moderator: report status counts */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator', 'support')
  @Get('stats')
  getStats() {
    return this.reportsService.getStatusCounts();
  }

  /** Admin/moderator: view single report */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator', 'support')
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reportsService.findOne(user, id);
  }

  /** Admin/moderator: set report to under_review */
  @UseGuards(PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/review')
  setUnderReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reportsService.setUnderReview(user, id);
  }

  /** Admin/moderator: resolve or dismiss a report */
  @UseGuards(PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/resolve')
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(user, id, dto);
  }

  /** Admin/moderator: set report to investigating */
  @UseGuards(PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/investigate')
  setInvestigating(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reportsService.setInvestigating(user, id);
  }

  /** Admin/moderator: close a resolved/dismissed report */
  @UseGuards(PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/close')
  closeReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.reportsService.closeReport(user, id, dto.note);
  }

  /** Admin/moderator: get conversation history for a report */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator', 'support')
  @Get(':id/conversation')
  getConversationHistory(
    @Param('id') id: string,
  ) {
    return this.reportsService.getConversationHistory(id);
  }

  /** Admin/moderator: get audit logs for a report */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator', 'support')
  @Get(':id/audit-logs')
  getAuditLogs(
    @Param('id') id: string,
  ) {
    return this.reportsService.getAuditLogs(id);
  }
}

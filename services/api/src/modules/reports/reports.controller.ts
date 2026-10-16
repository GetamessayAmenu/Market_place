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
import { Permissions, RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(user, dto);
  }

  /** Users can view their own reports; admins see all */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportQueryDto,
  ) {
    const scoped = Object.assign(new ReportQueryDto(), query, { reporterId: user.id });
    return this.reportsService.findAll(scoped);
  }

  /** Admin/moderator: list all reports with filters */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'platform_admin', 'moderator', 'support')
  @RequirePermission('reports.view')
  @Get()
  findAll(@Query() query: ReportQueryDto) {
    return this.reportsService.findAll(query);
  }

  /** Admin/moderator: report status counts */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'platform_admin', 'moderator', 'support')
  @RequirePermission('reports.view')
  @Get('stats')
  getStats() {
    return this.reportsService.getStatusCounts();
  }

  /** Admin/moderator: view single report */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin', 'super_admin', 'platform_admin', 'moderator', 'support')
  @RequirePermission('reports.view')
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reportsService.findOne(user, id);
  }

  /** Admin/moderator: set report to under_review */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/review')
  setUnderReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reportsService.setUnderReview(user, id);
  }

  /** Admin/moderator: resolve or dismiss a report */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/resolve')
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(user, id, dto);
  }

  /** Admin/moderator: assign admin to report */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/assign')
  assignAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { adminId: string | null },
  ) {
    return this.reportsService.assignAdmin(user, id, body.adminId);
  }

  /** Admin/moderator: escalate report */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/escalate')
  escalate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.reportsService.escalate(user, id, body.note);
  }

  /** Admin/moderator: set report to investigating */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Patch(':id/investigate')
  setInvestigating(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reportsService.setInvestigating(user, id);
  }

  /** Admin/moderator: close a resolved/dismissed report */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'moderator', 'support')
  @Get(':id/conversation')
  getConversationHistory(
    @Param('id') id: string,
  ) {
    return this.reportsService.getConversationHistory(id);
  }

  /** Admin/moderator: get audit logs for a report */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'moderator', 'support')
  @Get(':id/audit-logs')
  getAuditLogs(
    @Param('id') id: string,
  ) {
    return this.reportsService.getAuditLogs(id);
  }

  /** Admin/moderator: add internal moderation note */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Post(':id/notes')
  addInternalNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { note: string },
  ) {
    return this.reportsService.addInternalNote(user, id, body.note);
  }

  /** Admin/moderator: execute contextual moderation action */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Post(':id/action')
  takeModerationAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { action: string; note?: string; durationDays?: number },
  ) {
    return this.reportsService.takeModerationAction(user, id, body);
  }

  /** Admin/moderator: convert a report into a dispute */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ resource: 'report', action: 'moderate' })
  @Post(':id/convert-to-dispute')
  convertToDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { categoryId?: string; priority?: string; note?: string },
  ) {
    return this.reportsService.convertToDispute(user, id, body);
  }
}

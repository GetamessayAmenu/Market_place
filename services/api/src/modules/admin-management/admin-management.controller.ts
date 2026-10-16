import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { SecurityEventsService } from '../security-events/security-events.service';
import { AdminManagementService } from './admin-management.service';
import {
  AdminQueryDto,
  CreateAdminUserDto,
  ResetMfaDto,
  SuspendAdminDto,
  UpdateAdminRoleDto,
} from './dto/admin-user.dto';

@Controller('admin/admins')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AdminManagementController {
  constructor(
    private readonly adminManagementService: AdminManagementService,
    private readonly securityEventsService: SecurityEventsService,
  ) {}

  @Get()
  @RequirePermission('admins.view')
  listAdmins(@Query() query: AdminQueryDto) {
    return this.adminManagementService.listAdmins(query);
  }

  @Post()
  @RequirePermission('admins.create')
  createAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdminUserDto,
    @Req() req: Request,
  ) {
    return this.adminManagementService.createAdmin(
      user,
      dto,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Get(':id')
  @RequirePermission('admins.view')
  getAdmin(@Param('id') id: string) {
    return this.adminManagementService.getAdmin(id);
  }

  @Patch(':id/role')
  @RequirePermission('admins.assign_roles')
  updateAdminRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAdminRoleDto,
    @Req() req: Request,
  ) {
    return this.adminManagementService.updateAdminRole(
      user,
      id,
      dto,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Post(':id/suspend')
  @RequirePermission('admins.suspend')
  suspendAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SuspendAdminDto,
    @Req() req: Request,
  ) {
    return this.adminManagementService.suspendAdmin(
      user,
      id,
      dto,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Post(':id/reactivate')
  @RequirePermission('admins.suspend')
  reactivateAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.adminManagementService.reactivateAdmin(
      user,
      id,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Post(':id/revoke-sessions')
  @RequirePermission('admins.update')
  revokeSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.adminManagementService.revokeSessions(
      user,
      id,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Post(':id/reset-mfa')
  @RequirePermission('security.manage')
  resetMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResetMfaDto,
    @Req() req: Request,
  ) {
    return this.adminManagementService.resetMfa(
      user,
      id,
      dto,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Get(':id/security-history')
  @RequirePermission('security.view')
  getSecurityHistory(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.securityEventsService.findEvents({
      targetUserId: id,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id/sessions')
  @RequirePermission('admins.view')
  async getSessions(@Param('id') id: string) {
    const admin = await this.adminManagementService.getAdmin(id);
    return admin.sessions;
  }
}

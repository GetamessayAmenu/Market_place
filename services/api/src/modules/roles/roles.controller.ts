import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  AssignRolePermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RolesService } from './roles.service';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('roles.view')
  listRoles() {
    return this.rolesService.listRoles();
  }

  @Get(':id')
  @RequirePermission('roles.view')
  getRole(@Param('id') id: string) {
    return this.rolesService.getRole(id);
  }

  @Post()
  @RequirePermission('roles.create')
  createRole(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(user, dto);
  }

  @Patch(':id')
  @RequirePermission('roles.update')
  updateRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(user, id, dto);
  }

  @Delete(':id')
  @RequirePermission('roles.delete')
  deleteRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.rolesService.deleteRole(user, id);
  }

  @Put(':id/permissions')
  @RequirePermission('roles.assign_permissions')
  syncPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    return this.rolesService.syncRolePermissions(user, id, dto);
  }
}

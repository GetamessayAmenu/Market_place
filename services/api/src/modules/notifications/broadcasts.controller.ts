import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastQueryDto } from './dto/broadcast-query.dto';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';

@Controller('notifications/admin/broadcasts')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'platform_admin')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Get('stats')
  @RequirePermission('notifications.view')
  getStats() {
    return this.broadcastsService.getStats();
  }

  @Get()
  @RequirePermission('notifications.view')
  findAll(@Query() query: BroadcastQueryDto) {
    return this.broadcastsService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('notifications.view')
  getById(@Param('id') id: string) {
    return this.broadcastsService.getById(id);
  }

  @Post()
  @RequirePermission('notifications.manage')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.broadcastsService.createBroadcast(user, dto);
  }

  @Patch(':id')
  @RequirePermission('notifications.manage')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBroadcastDto,
  ) {
    return this.broadcastsService.updateBroadcast(user, id, dto);
  }

  @Delete(':id')
  @RequirePermission('notifications.manage')
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.deleteDraft(user, id);
  }

  @Post(':id/send')
  @RequirePermission('notifications.manage')
  sendNow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.sendNow(user, id);
  }

  @Post(':id/cancel')
  @RequirePermission('notifications.manage')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.cancelScheduled(user, id);
  }
}

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
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastQueryDto } from './dto/broadcast-query.dto';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';

@Controller('notifications/admin/broadcasts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Get('stats')
  getStats() {
    return this.broadcastsService.getStats();
  }

  @Get()
  findAll(@Query() query: BroadcastQueryDto) {
    return this.broadcastsService.findAll(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.broadcastsService.getById(id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.broadcastsService.createBroadcast(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBroadcastDto,
  ) {
    return this.broadcastsService.updateBroadcast(user, id, dto);
  }

  @Delete(':id')
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.deleteDraft(user, id);
  }

  @Post(':id/send')
  sendNow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.sendNow(user, id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.cancelScheduled(user, id);
  }
}

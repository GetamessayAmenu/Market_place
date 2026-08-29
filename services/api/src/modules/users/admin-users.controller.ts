import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'moderator', 'support')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.usersService.getStatusCounts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  adminUpdate(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdate({ id: admin.id }, id, dto);
  }
}

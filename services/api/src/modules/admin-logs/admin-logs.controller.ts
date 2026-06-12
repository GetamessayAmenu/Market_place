import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminLogsService } from './admin-logs.service';
import type { AdminLogQueryDto } from './dto/admin-log-query.dto';

@Controller('admin/audit-logs')
@UseGuards(RolesGuard)
@Roles('admin', 'super_admin')
export class AdminLogsController {
  constructor(private readonly adminLogsService: AdminLogsService) {}

  @Get()
  findAll(@Query() query: AdminLogQueryDto) {
    return this.adminLogsService.findLogs(query);
  }
}

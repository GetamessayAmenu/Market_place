import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminLogsService } from './admin-logs.service';
import { AdminLogQueryDto } from './dto/admin-log-query.dto';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'moderator')
export class AdminLogsController {
  constructor(private readonly adminLogsService: AdminLogsService) {}

  @Get()
  @Permissions({ resource: 'admin_log', action: 'read' })
  findAll(@Query() query: AdminLogQueryDto) {
    return this.adminLogsService.findLogs(query);
  }

  @Get('export')
  @Permissions({ resource: 'admin_log', action: 'export' })
  async exportCsv(@Query() query: AdminLogQueryDto, @Res() res: Response) {
    const csvContent = await this.adminLogsService.exportLogsCsv(query);
    const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  }

  @Get(':id')
  @Permissions({ resource: 'admin_log', action: 'read' })
  findOne(@Param('id') id: string) {
    return this.adminLogsService.findLogById(id);
  }
}

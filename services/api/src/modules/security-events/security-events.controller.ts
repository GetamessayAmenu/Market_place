import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventQueryDto } from './dto/security-event-query.dto';

@Controller('admin/security-events')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SecurityEventsController {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  @Get()
  @RequirePermission('security.view')
  async findAll(@Query() query: SecurityEventQueryDto) {
    return this.securityEventsService.findEvents(query);
  }

  @Get('overview')
  @RequirePermission('security.view')
  async getOverview() {
    return this.securityEventsService.getSecurityOverview();
  }
}

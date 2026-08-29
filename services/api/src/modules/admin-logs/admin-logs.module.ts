import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminLogsController } from './admin-logs.controller';
import { AdminLogsService } from './admin-logs.service';
import { AuditEventListener } from './listeners/audit-event.listener';

@Module({
  controllers: [AdminLogsController],
  providers: [AdminLogsService, AuditEventListener, RolesGuard],
  exports: [AdminLogsService],
})

export class AdminLogsModule {}

import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminLogsController } from './admin-logs.controller';
import { AdminLogsService } from './admin-logs.service';

@Module({
  controllers: [AdminLogsController],
  providers: [AdminLogsService, RolesGuard],
  exports: [AdminLogsService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AdminLogsModule {}

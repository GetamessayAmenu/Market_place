import { Module } from '@nestjs/common';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsRepository, ReportsService, RolesGuard, PermissionsGuard],
  exports: [ReportsService, ReportsRepository],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ReportsModule {}

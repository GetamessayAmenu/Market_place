import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RolesGuard],
  exports: [AnalyticsService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AnalyticsModule {}

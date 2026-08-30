import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsEventListener } from './listeners/analytics-event.listener';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository, AnalyticsEventListener, RolesGuard],
  exports: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}

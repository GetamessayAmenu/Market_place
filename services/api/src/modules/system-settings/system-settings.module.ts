import { Module } from '@nestjs/common';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SecurityEventsModule } from '../security-events/security-events.module';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';

@Module({
  imports: [AuthorizationModule, AdminLogsModule, SecurityEventsModule],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}

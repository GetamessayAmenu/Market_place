import { Module } from '@nestjs/common';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SecurityEventsModule } from '../security-events/security-events.module';
import { RolesController } from './roles.controller';
import { RolesRepository } from './roles.repository';
import { RolesService } from './roles.service';

@Module({
  imports: [AuthorizationModule, AdminLogsModule, SecurityEventsModule],
  controllers: [RolesController],
  providers: [RolesRepository, RolesService],
  exports: [RolesService, RolesRepository],
})
export class RolesModule {}

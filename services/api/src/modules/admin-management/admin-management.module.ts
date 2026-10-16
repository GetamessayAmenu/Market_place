import { Module } from '@nestjs/common';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SecurityEventsModule } from '../security-events/security-events.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AdminManagementController } from './admin-management.controller';
import { AdminManagementService } from './admin-management.service';

@Module({
  imports: [
    AuthorizationModule,
    SecurityEventsModule,
    AdminLogsModule,
    SessionsModule,
    AuthModule,
  ],
  controllers: [AdminManagementController],
  providers: [AdminManagementService],
  exports: [AdminManagementService],
})
export class AdminManagementModule {}

import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { VerificationAdminService } from './verification-admin.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [VerificationController],
  providers: [VerificationAdminService, RolesGuard],
  exports: [VerificationAdminService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class VerificationModule {}

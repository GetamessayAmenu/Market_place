import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Global()
@Module({
  providers: [AuthorizationService, PermissionsGuard],
  exports: [AuthorizationService, PermissionsGuard],
})
export class AuthorizationModule {}

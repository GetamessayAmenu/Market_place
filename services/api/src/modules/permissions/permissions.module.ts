import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsRepository } from './permissions.repository';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [PermissionsController],
  providers: [PermissionsRepository, PermissionsService],
  exports: [PermissionsService, PermissionsRepository],
})
export class PermissionsModule {}

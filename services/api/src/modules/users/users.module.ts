import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';

import { AdminUsersController } from './admin-users.controller';
import { ProfileController } from './profile.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [PermissionsModule, RolesModule, AdminLogsModule],
  controllers: [AdminUsersController, ProfileController],
  providers: [UsersRepository, UsersService, RolesGuard],
  exports: [UsersService, UsersRepository],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UsersModule {}

import { Body, Controller, Delete, Patch } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('me')
  deleteSelf(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deleteSelf(user.id);
  }
}

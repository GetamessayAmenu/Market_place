import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller(['users', 'sellers'])
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  // Specific routes must come before parameterized routes
  @Get('following')
  @UseGuards(JwtAuthGuard)
  getFollowing(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getFollowing(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  deleteSelf(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deleteSelf(user.id);
  }

  // Parameterized routes
  @Public()
  @OptionalAuth()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() viewer?: AuthenticatedUser) {
    return this.usersService.findOne(id, viewer);
  }

  @Public()
  @OptionalAuth()
  @Get(':id/listings')
  findUserListings(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'all' | 'buy' | 'rent' | 'custom',
    @Query('sortBy') sortBy?: 'newest' | 'price_asc' | 'price_desc',
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.usersService.findUserListings(
      id,
      {
        ...(page ? { page: Number(page) } : {}),
        ...(limit ? { limit: Number(limit) } : {}),
        ...(type ? { type } : {}),
        ...(sortBy ? { sortBy } : {}),
      },
      viewer,
    );
  }

  // ─── Store Follow Feature ───────────────────────────────────────────────────

  @Post('stores/:storeId/follow')
  @UseGuards(JwtAuthGuard)
  toggleStoreFollow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId') storeId: string,
  ) {
    return this.usersService.toggleStoreFollow(user.id, storeId);
  }
}

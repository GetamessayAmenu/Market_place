import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { FavoritesService } from '../favorites/favorites.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingOwnerGuard } from './guards/listing-owner.guard';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly favoritesService: FavoritesService,
  ) {}

  @UseGuards(PermissionsGuard)
  @Permissions({ resource: 'listing', action: 'create' })
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateListingDto,
  ) {
    return this.listingsService.create(user, dto);
  }

  @Public()
  @OptionalAuth()
  @Get()
  findAll(
    @Query() query: ListingQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.listingsService.findAll(query, user);
  }

  @Public()
  @OptionalAuth()
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.listingsService.findOne(id, user);
  }

  @UseGuards(PermissionsGuard, ListingOwnerGuard)
  @Permissions({ resource: 'listing', action: 'update' })
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(user, id, dto);
  }

  @UseGuards(PermissionsGuard, ListingOwnerGuard)
  @Permissions({ resource: 'listing', action: 'delete' })
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('hard') hard?: string,
  ) {
    if (hard === 'true') {
      return this.listingsService.hardDelete(user, id);
    }
    return this.listingsService.softDelete(user, id);
  }

  @UseGuards(PermissionsGuard, ListingOwnerGuard)
  @Permissions({ resource: 'listing', action: 'update' })
  @Post(':id/sold')
  markSold(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.markAsSold(user, id);
  }

  @UseGuards(PermissionsGuard, ListingOwnerGuard)
  @Permissions({ resource: 'listing', action: 'update' })
  @Post(':id/renew')
  renew(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.renew(user, id);
  }

  @UseGuards(PermissionsGuard, ListingOwnerGuard)
  @Permissions({ resource: 'listing', action: 'update' })
  @Post(':id/hide')
  hide(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.hide(user, id);
  }

  @UseGuards(PermissionsGuard, ListingOwnerGuard)
  @Permissions({ resource: 'listing', action: 'update' })
  @Post(':id/publish')
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.publish(user, id);
  }

  @Post(':id/favorite')
  addFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.favoritesService.addFavorite(user.id, id);
  }

  @Delete(':id/favorite')
  removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.favoritesService.removeFavorite(user.id, id);
  }
}

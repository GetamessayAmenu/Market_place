import { Controller, Get, Param, Query } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ListingQueryDto } from './dto/listing-query.dto';
import { ListingsService } from './listings.service';

@Controller('users')
export class UserListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Public()
  @OptionalAuth()
  @Get(':id/listings')
  findSellerListings(
    @Param('id') sellerId: string,
    @Query() query: ListingQueryDto,
    @CurrentUser() viewer?: AuthenticatedUser,
  ) {
    return this.listingsService.findBySeller(sellerId, query, viewer);
  }
}

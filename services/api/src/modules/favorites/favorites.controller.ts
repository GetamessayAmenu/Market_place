import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { ListingsRepository } from '../listings/listings.repository';
import { serializeListingSummary } from '../listings/serializers/listing.serializer';
import { FavoritesQueryDto } from './dto/favorites-query.dto';
import { FavoritesRepository } from './favorites.repository';

@Controller('favorites')
export class FavoritesController {
  constructor(
    private readonly favoritesRepository: FavoritesRepository,
    private readonly listingsRepository: ListingsRepository,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FavoritesQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.favoritesRepository.findPaginatedByUser(user.id, skip, limit),
      this.favoritesRepository.countByUser(user.id),
    ]);

    const listings = await Promise.all(
      favorites.map((f) => this.listingsRepository.findByIdWithRelations(f.listingId)),
    );

    const items = listings
      .filter((l): l is NonNullable<typeof l> => l !== null && l.deletedAt === null)
      .map((l) => ({ ...serializeListingSummary(l), isFavorited: true }));

    return toPaginatedResponse({
      items,
      total,
      page,
      limit,
    });
  }
}

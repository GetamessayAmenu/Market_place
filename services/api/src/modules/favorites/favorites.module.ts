import { Module, forwardRef } from '@nestjs/common';

import { ListingsModule } from '../listings/listings.module';
import { FavoritesController } from './favorites.controller';
import { FavoritesRepository } from './favorites.repository';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [forwardRef(() => ListingsModule)],
  controllers: [FavoritesController],
  providers: [FavoritesRepository, FavoritesService],
  exports: [FavoritesService, FavoritesRepository],
})
export class FavoritesModule {}

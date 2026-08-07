import { Module, forwardRef } from '@nestjs/common';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { CategoriesModule } from '../categories/categories.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';

import { AdminListingsController } from './admin-listings.controller';
import { ListingsCacheService } from './cache/listings-cache.service';
import { ListingOwnerGuard } from './guards/listing-owner.guard';
import { ListingAnalyticsListener } from './listeners/listing-analytics.listener';
import { ListingsController } from './listings.controller';
import { ListingsRepository } from './listings.repository';
import { ListingsService } from './listings.service';
import { UserListingsController } from './user-listings.controller';

@Module({
  imports: [CategoriesModule, UploadsModule, forwardRef(() => FavoritesModule), AdminLogsModule, forwardRef(() => NotificationsModule)],
  controllers: [ListingsController, UserListingsController, AdminListingsController],
  providers: [
    ListingsRepository,
    ListingsService,
    ListingsCacheService,
    ListingOwnerGuard,
    ListingAnalyticsListener,
    PermissionsGuard,
    RolesGuard,
  ],
  exports: [ListingsRepository, ListingsService],
})
export class ListingsModule {}

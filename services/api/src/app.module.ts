import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AdminAuditInterceptor } from './common/interceptors/admin-audit.interceptor';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AdminLogsController } from './modules/admin-logs/admin-logs.controller';
import { AdminLogsService } from './modules/admin-logs/admin-logs.service';
import { AdminCategoriesController } from './modules/categories/admin-categories.controller';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CustomOrdersModule } from './modules/custom-orders/custom-orders.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HealthModule } from './modules/health/health.module';
import { ListingsModule } from './modules/listings/listings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SearchModule } from './modules/search/search.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { VerificationModule } from './modules/verification/verification.module';

@Module({
  imports: [
    InfrastructureModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    AttributesModule,
    OrdersModule,
    UploadsModule,
    ListingsModule,
    FavoritesModule,
    SearchModule,
    NotificationsModule,
    ReportsModule,
    AnalyticsModule,
    VerificationModule,
    CustomOrdersModule,
    ReviewsModule,
  ],
  controllers: [AppController, AdminLogsController, AdminCategoriesController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AdminLogsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AdminAuditInterceptor,
    },
  ],
})
export class AppModule {}

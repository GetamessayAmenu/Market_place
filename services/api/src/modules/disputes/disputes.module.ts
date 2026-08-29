import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DisputeCategoryController } from './dispute-category.controller';
import { DisputesController } from './disputes.controller';
import { DisputesRepository } from './disputes.repository';
import { DisputesService } from './disputes.service';

@Module({
  controllers: [DisputesController, DisputeCategoryController],
  providers: [DisputesService, DisputesRepository, PrismaService],
  imports: [AdminLogsModule, NotificationsModule],
  exports: [DisputesService, DisputesRepository],
})
export class DisputesModule {}

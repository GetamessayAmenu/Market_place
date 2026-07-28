import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { RentalsRepository } from './rentals.repository';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { RentalRemindersProcessor } from './processors/rental-reminders.processor';
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';

@Module({
  imports: [
    AdminLogsModule,
    NotificationsModule,
    QueueModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.RENTAL_REMINDERS }),
  ],
  controllers: [RentalsController],
  providers: [RentalsService, RentalsRepository, RentalRemindersProcessor],
  exports: [RentalsService],
})
export class RentalsModule {}

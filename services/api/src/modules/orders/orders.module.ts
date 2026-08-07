import { Module } from '@nestjs/common';

import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { OrderStateMachineService } from './order-state-machine.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [NotificationsModule, UploadsModule],
  controllers: [AdminOrdersController, OrdersController],
  providers: [OrdersService, OrdersRepository, OrderStateMachineService],
  exports: [OrdersService],
})
export class OrdersModule {}

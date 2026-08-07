import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ListingsModule } from '../listings/listings.module';

import { CustomOrdersController } from './custom-orders.controller';
import { CustomOrdersRepository } from './custom-orders.repository';
import { CustomOrdersService } from './custom-orders.service';

@Module({
  imports: [ListingsModule],
  controllers: [CustomOrdersController],
  providers: [
    CustomOrdersRepository,
    CustomOrdersService,
    EventEmitter2,
  ],
  exports: [CustomOrdersService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CustomOrdersModule {}

import { Module } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [OrdersGateway],
  exports: [OrdersGateway],
})
export class OrdersModule {}

import { Module } from '@nestjs/common';

import { ChatModule } from './chat/chat.module';
import { GatewayModule } from './gateway/gateway.module';
import { HealthModule } from './health/health.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [InfrastructureModule, HealthModule, ChatModule, GatewayModule, OrdersModule],
})
export class AppModule {}

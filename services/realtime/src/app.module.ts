import { Module } from '@nestjs/common';

import { ChatModule } from './chat/chat.module';
import { GatewayModule } from './gateway/gateway.module';
import { HealthModule } from './health/health.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule, HealthModule, ChatModule, GatewayModule],
})
export class AppModule {}

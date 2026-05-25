import { Global, Module } from '@nestjs/common';

import { RealtimeConfigService } from './realtime-config.service';

@Global()
@Module({
  providers: [RealtimeConfigService],
  exports: [RealtimeConfigService],
})
export class RealtimeConfigModule {}

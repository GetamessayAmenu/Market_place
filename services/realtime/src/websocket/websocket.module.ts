import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { RealtimeConfigService } from '../infrastructure/config/realtime-config.service';
import { SocketAuthMiddleware } from './socket-auth.middleware';
import { SocketAuthService } from './socket-auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [RealtimeConfigService],
      useFactory: (config: RealtimeConfigService) => ({
        secret: config.jwtAccessSecret,
      }),
    }),
  ],
  providers: [SocketAuthService, SocketAuthMiddleware],
  exports: [SocketAuthService, SocketAuthMiddleware, JwtModule],
})
export class WebsocketModule {}

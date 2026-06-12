import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ApiConfigService } from '../../infrastructure/config/api-config.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { JWT_ACCESS_STRATEGY } from './auth.constants';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TokenService } from './token.service';
import { VerificationService } from './verification/verification.service';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    SessionsModule,
    PermissionsModule,
    PassportModule.register({ defaultStrategy: JWT_ACCESS_STRATEGY }),
    JwtModule.registerAsync({
      inject: [ApiConfigService],
      useFactory: (config: ApiConfigService) => ({
        secret: config.jwtAccessSecret,
        signOptions: { expiresIn: config.jwtAccessExpiresIn },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    TokenService,
    VerificationService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
    RateLimitGuard,
  ],
  exports: [AuthService, JwtModule, TokenService, VerificationService],
})
export class AuthModule {}

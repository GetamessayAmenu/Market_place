import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '@marketplace/types';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { ApiConfigService } from '../../../infrastructure/config/api-config.service';
import { SessionsService } from '../../sessions/sessions.service';
import { UsersService } from '../../users/users.service';
import { COOKIE_ACCESS_TOKEN, JWT_ACCESS_STRATEGY } from '../auth.constants';

function accessTokenExtractor(req: Request): string | null {
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (bearer) {
    return bearer;
  }
  const cookieToken = req.cookies?.[COOKIE_ACCESS_TOKEN];
  return typeof cookieToken === 'string' ? cookieToken : null;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, JWT_ACCESS_STRATEGY) {
  constructor(
    config: ApiConfigService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: accessTokenExtractor,
      ignoreExpiration: false,
      secretOrKey: config.jwtAccessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (await this.sessionsService.isAccessTokenBlacklisted(payload.jti)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    await this.sessionsService.assertSessionActive(payload.sessionId);

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedException('Account is suspended');
    }
    if (user.status === 'banned') {
      throw new UnauthorizedException('Account is banned');
    }

    const authenticated = await this.usersService.toAuthenticatedUser(user);
    return { ...authenticated, sessionId: payload.sessionId };
  }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { Request } from 'express';

import { SessionInvalidException } from '../exceptions/auth.exceptions';
import { extractRefreshToken } from '../utils/cookie.util';
import { JWT_REFRESH_STRATEGY } from '../auth.constants';
import { SessionsService } from '../../sessions/sessions.service';
import type { SessionRecord } from '../../sessions/interfaces/session-record.interface';

/**
 * Validates opaque refresh token from HttpOnly cookie (used on POST /auth/refresh).
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, JWT_REFRESH_STRATEGY) {
  constructor(private readonly sessionsService: SessionsService) {
    super();
  }

  async validate(req: Request): Promise<SessionRecord> {
    const refreshToken = extractRefreshToken(req.cookies ?? {});
    if (!refreshToken) {
      throw new SessionInvalidException('Refresh token missing');
    }
    return this.sessionsService.validateRefreshToken(refreshToken);
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@marketplace/types';

import { ApiConfigService } from '../../infrastructure/config/api-config.service';
import { generateTokenId, parseDurationToSeconds } from './utils/token.util';

export interface SignedAccessToken {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly jti: string;
}

@Injectable()
export class TokenService {
  private readonly accessExpiresSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ApiConfigService,
  ) {
    this.accessExpiresSeconds = parseDurationToSeconds(this.config.jwtAccessExpiresIn);
  }

  signAccessToken(params: {
    userId: string;
    email: string;
    role: JwtPayload['role'];
    sessionId: string;
  }): SignedAccessToken {
    const jti = generateTokenId();
    const payload: JwtPayload = {
      sub: params.userId,
      email: params.email,
      role: params.role,
      sessionId: params.sessionId,
      jti,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: this.config.jwtAccessExpiresIn,
    });

    return {
      accessToken,
      expiresIn: this.accessExpiresSeconds,
      jti,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.config.jwtAccessSecret,
    });
  }
}

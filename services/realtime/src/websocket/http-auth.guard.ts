import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@marketplace/types';
import type { Request } from 'express';

import { SESSION_REDIS_KEYS } from '../events.constants';
import { RealtimeConfigService } from '../infrastructure/config/realtime-config.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import type { SocketUser } from './interfaces/socket-user.interface';

export const HTTP_USER_KEY = 'user';

@Injectable()
export class HttpAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: RealtimeConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    const blacklisted = await this.redis.get(
      `${SESSION_REDIS_KEYS.BLACKLIST}${payload.jti}`,
    );
    if (blacklisted === '1') {
      throw new UnauthorizedException('Token has been revoked');
    }

    const sessionRaw = await this.redis.get(
      `${SESSION_REDIS_KEYS.SESSION}${payload.sessionId}`,
    );
    if (!sessionRaw) {
      throw new UnauthorizedException('Session is invalid');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        role: { select: { slug: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      throw new UnauthorizedException(`Account is ${user.status}`);
    }

    const socketUser: SocketUser = {
      id: user.id,
      email: user.email,
      role: user.role.slug as SocketUser['role'],
      sessionId: payload.sessionId,
      displayName: user.displayName,
      status: user.status,
    };

    (request as Request & { user: SocketUser }).user = socketUser;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return undefined;
  }
}

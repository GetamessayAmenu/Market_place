import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '@marketplace/types';
import type { Socket } from 'socket.io';

import { SESSION_REDIS_KEYS } from '../events.constants';
import { RealtimeConfigService } from '../infrastructure/config/realtime-config.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import type { SocketUser } from './interfaces/socket-user.interface';

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: RealtimeConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticateSocket(socket: Socket): Promise<SocketUser> {
    const token = this.extractToken(socket);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
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

    socket.data.user = socketUser;
    return socketUser;
  }

  getSocketUser(socket: Socket): SocketUser {
    const user = socket.data.user as SocketUser | undefined;
    if (!user) {
      throw new UnauthorizedException('Socket not authenticated');
    }
    return user;
  }

  private extractToken(socket: Socket): string | undefined {
    const auth = socket.handshake.auth as { token?: string };
    if (typeof auth?.token === 'string' && auth.token.length > 0) {
      return auth.token;
    }

    const header = socket.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    const queryToken = socket.handshake.query.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return undefined;
  }
}

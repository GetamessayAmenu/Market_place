import { Injectable } from '@nestjs/common';

import { ApiConfigService } from '../../infrastructure/config/api-config.service';
import { SessionInvalidException } from '../auth/exceptions/auth.exceptions';
import {
  generateOpaqueToken,
  generateSessionId,
  hashToken,
  parseDurationToSeconds,
} from '../auth/utils/token.util';
import type { SessionDeviceInfo, SessionRecord } from './interfaces/session-record.interface';
import { SessionsRepository } from './sessions.repository';

export interface CreateSessionInput {
  readonly userId: string;
  readonly device: SessionDeviceInfo;
}

export interface CreateSessionResult {
  readonly sessionId: string;
  readonly refreshToken: string;
  readonly refreshTokenHash: string;
}

export interface RotateSessionResult {
  readonly refreshToken: string;
  readonly refreshTokenHash: string;
}

@Injectable()
export class SessionsService {
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly config: ApiConfigService,
  ) {
    this.refreshTtlSeconds = parseDurationToSeconds(this.config.jwtRefreshExpiresIn);
  }

  async createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
    const sessionId = generateSessionId();
    const refreshToken = generateOpaqueToken();
    const refreshTokenHash = hashToken(refreshToken);
    const now = new Date().toISOString();

    const record: SessionRecord = {
      sessionId,
      userId: input.userId,
      refreshTokenHash,
      createdAt: now,
      lastActiveAt: now,
      device: input.device,
    };

    await this.sessionsRepository.saveSession(record, this.refreshTtlSeconds);

    return { sessionId, refreshToken, refreshTokenHash };
  }

  async validateRefreshToken(refreshToken: string): Promise<SessionRecord> {
    const refreshHash = hashToken(refreshToken);
    const sessionId = await this.sessionsRepository.getSessionIdByRefreshHash(refreshHash);

    if (!sessionId) {
      throw new SessionInvalidException();
    }

    const session = await this.sessionsRepository.getSession(sessionId);
    if (!session || session.refreshTokenHash !== refreshHash) {
      throw new SessionInvalidException();
    }

    return session;
  }

  async rotateRefreshToken(
    session: SessionRecord,
    oldRefreshToken: string,
  ): Promise<RotateSessionResult> {
    const oldHash = hashToken(oldRefreshToken);
    if (session.refreshTokenHash !== oldHash) {
      throw new SessionInvalidException('Refresh token reuse detected');
    }

    await this.sessionsRepository.deleteSession(
      session.sessionId,
      session.userId,
      session.refreshTokenHash,
    );

    const refreshToken = generateOpaqueToken();
    const refreshTokenHash = hashToken(refreshToken);
    const now = new Date().toISOString();

    const updated: SessionRecord = {
      ...session,
      refreshTokenHash,
      lastActiveAt: now,
      rotatedAt: now,
      suspicious: session.rotatedAt !== undefined,
    };

    await this.sessionsRepository.saveSession(updated, this.refreshTtlSeconds);

    return { refreshToken, refreshTokenHash };
  }

  async invalidateSession(session: SessionRecord): Promise<void> {
    await this.sessionsRepository.deleteSession(
      session.sessionId,
      session.userId,
      session.refreshTokenHash,
    );
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.sessionsRepository.listUserSessionIds(userId);
    await Promise.all(
      sessionIds.map(async (sessionId) => {
        const session = await this.sessionsRepository.getSession(sessionId);
        if (session) {
          await this.sessionsRepository.deleteSession(
            session.sessionId,
            session.userId,
            session.refreshTokenHash,
          );
        }
      }),
    );
  }

  async assertSessionActive(sessionId: string): Promise<SessionRecord> {
    const session = await this.sessionsRepository.getSession(sessionId);
    if (!session) {
      throw new SessionInvalidException();
    }
    return session;
  }

  async blacklistAccessToken(jti: string): Promise<void> {
    const ttl = parseDurationToSeconds(this.config.jwtAccessExpiresIn);
    await this.sessionsRepository.blacklistAccessToken(jti, ttl);
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    return this.sessionsRepository.isAccessTokenBlacklisted(jti);
  }

  async getUserSessions(userId: string): Promise<SessionRecord[]> {
    const sessionIds = await this.sessionsRepository.listUserSessionIds(userId);
    const sessions = await Promise.all(
      sessionIds.map((sid) => this.sessionsRepository.getSession(sid)),
    );
    return sessions.filter((s): s is SessionRecord => s !== null);
  }

  async getUserSessionCount(userId: string): Promise<number> {
    const sessionIds = await this.sessionsRepository.listUserSessionIds(userId);
    return sessionIds.length;
  }
}

import { Injectable } from '@nestjs/common';

import { RedisService } from '../../infrastructure/redis/redis.service';
import type { SessionRecord } from './interfaces/session-record.interface';

const SESSION_PREFIX = 'mp:session:';
const REFRESH_PREFIX = 'mp:refresh:';
const USER_SESSIONS_PREFIX = 'mp:user:sessions:';
const BLACKLIST_PREFIX = 'mp:blacklist:access:';

@Injectable()
export class SessionsRepository {
  constructor(private readonly redis: RedisService) {}

  async saveSession(record: SessionRecord, ttlSeconds: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.setex(
      `${SESSION_PREFIX}${record.sessionId}`,
      ttlSeconds,
      JSON.stringify(record),
    );
    pipeline.setex(
      `${REFRESH_PREFIX}${record.refreshTokenHash}`,
      ttlSeconds,
      record.sessionId,
    );
    pipeline.sadd(`${USER_SESSIONS_PREFIX}${record.userId}`, record.sessionId);
    pipeline.expire(`${USER_SESSIONS_PREFIX}${record.userId}`, ttlSeconds);
    await pipeline.exec();
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const raw = await this.redis.get(`${SESSION_PREFIX}${sessionId}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SessionRecord;
  }

  async getSessionIdByRefreshHash(refreshHash: string): Promise<string | null> {
    return this.redis.get(`${REFRESH_PREFIX}${refreshHash}`);
  }

  async deleteSession(sessionId: string, userId: string, refreshHash: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.del(`${SESSION_PREFIX}${sessionId}`);
    pipeline.del(`${REFRESH_PREFIX}${refreshHash}`);
    pipeline.srem(`${USER_SESSIONS_PREFIX}${userId}`, sessionId);
    await pipeline.exec();
  }

  async listUserSessionIds(userId: string): Promise<string[]> {
    return this.redis.smembers(`${USER_SESSIONS_PREFIX}${userId}`);
  }

  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.setex(`${BLACKLIST_PREFIX}${jti}`, ttlSeconds, '1');
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    const value = await this.redis.get(`${BLACKLIST_PREFIX}${jti}`);
    return value === '1';
  }
}

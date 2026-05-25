import { Injectable } from '@nestjs/common';

import { CHAT_SERVER_EVENTS, PRESENCE_REDIS_KEYS } from '../events.constants';
import { RealtimeConfigService } from '../infrastructure/config/realtime-config.service';
import { RedisService } from '../infrastructure/redis/redis.service';

export interface PresenceState {
  readonly userId: string;
  readonly online: boolean;
  readonly lastSeenAt: string | null;
}

@Injectable()
export class PresenceService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: RealtimeConfigService,
  ) {}

  async registerConnection(userId: string, socketId: string): Promise<boolean> {
    const pipeline = this.redis.pipeline();
    pipeline.sadd(`${PRESENCE_REDIS_KEYS.USER_SOCKETS}${userId}`, socketId);
    pipeline.set(`${PRESENCE_REDIS_KEYS.SOCKET_USER}${socketId}`, userId);
    const results = await pipeline.exec();
    const saddResult = results?.[0]?.[1];
    return saddResult === 1;
  }

  async unregisterConnection(socketId: string): Promise<{
    readonly userId: string | null;
    readonly wentOffline: boolean;
  }> {
    const userId = await this.redis.get(`${PRESENCE_REDIS_KEYS.SOCKET_USER}${socketId}`);
    if (!userId) {
      return { userId: null, wentOffline: false };
    }

    const pipeline = this.redis.pipeline();
    pipeline.srem(`${PRESENCE_REDIS_KEYS.USER_SOCKETS}${userId}`, socketId);
    pipeline.del(`${PRESENCE_REDIS_KEYS.SOCKET_USER}${socketId}`);
    await pipeline.exec();

    const remaining = await this.redis.scard(`${PRESENCE_REDIS_KEYS.USER_SOCKETS}${userId}`);
    const wentOffline = remaining === 0;

    if (wentOffline) {
      await this.redis.set(
        `${PRESENCE_REDIS_KEYS.LAST_SEEN}${userId}`,
        new Date().toISOString(),
      );
    }

    return { userId, wentOffline };
  }

  async getSocketIds(userId: string): Promise<string[]> {
    return this.redis.smembers(`${PRESENCE_REDIS_KEYS.USER_SOCKETS}${userId}`);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const count = await this.redis.scard(`${PRESENCE_REDIS_KEYS.USER_SOCKETS}${userId}`);
    return count > 0;
  }

  async getLastSeen(userId: string): Promise<string | null> {
    return this.redis.get(`${PRESENCE_REDIS_KEYS.LAST_SEEN}${userId}`);
  }

  async setTyping(conversationId: string, userId: string): Promise<void> {
    const key = `${PRESENCE_REDIS_KEYS.TYPING}${conversationId}:${userId}`;
    await this.redis.set(key, '1', 'PX', this.config.typingIndicatorTtlMs);
  }

  async clearTyping(conversationId: string, userId: string): Promise<void> {
    await this.redis.del(`${PRESENCE_REDIS_KEYS.TYPING}${conversationId}:${userId}`);
  }

  async incrementUnread(userId: string, conversationId: string): Promise<number> {
    const key = `${PRESENCE_REDIS_KEYS.UNREAD}${userId}:${conversationId}`;
    return this.redis.incr(key);
  }

  async resetUnread(userId: string, conversationId: string): Promise<void> {
    await this.redis.del(`${PRESENCE_REDIS_KEYS.UNREAD}${userId}:${conversationId}`);
  }

  async getUnreadCount(userId: string, conversationId: string): Promise<number> {
    const value = await this.redis.get(
      `${PRESENCE_REDIS_KEYS.UNREAD}${userId}:${conversationId}`,
    );
    return value ? Number.parseInt(value, 10) : 0;
  }

  presencePayload(userId: string, online: boolean, lastSeenAt: string | null) {
    return {
      userId,
      online,
      lastSeenAt,
      event: online ? CHAT_SERVER_EVENTS.USER_ONLINE : CHAT_SERVER_EVENTS.USER_OFFLINE,
    };
  }
}

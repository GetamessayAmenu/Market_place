import { Injectable } from '@nestjs/common';
import { parseRealtimeEnv, type RealtimeEnv } from '@marketplace/config';

@Injectable()
export class RealtimeConfigService {
  private readonly env: RealtimeEnv;

  constructor() {
    this.env = parseRealtimeEnv();
  }

  get nodeEnv(): RealtimeEnv['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get port(): number {
    return this.env.PORT;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.env.REDIS_URL;
  }

  get jwtAccessSecret(): string {
    return this.env.JWT_ACCESS_SECRET;
  }

  get corsOrigins(): readonly string[] {
    return this.env.CORS_ORIGINS;
  }

  get maxMessageLength(): number {
    return this.env.MAX_MESSAGE_LENGTH;
  }

  get typingIndicatorTtlMs(): number {
    return this.env.TYPING_INDICATOR_TTL_MS;
  }

  get raw(): Readonly<RealtimeEnv> {
    return this.env;
  }
}

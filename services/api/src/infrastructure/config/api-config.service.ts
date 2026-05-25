import { Injectable } from '@nestjs/common';
import { parseApiEnv, type ApiEnv } from '@marketplace/config';

@Injectable()
export class ApiConfigService {
  private readonly env: ApiEnv;

  constructor() {
    this.env = parseApiEnv();
  }

  get nodeEnv(): ApiEnv['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get port(): number {
    return this.env.PORT;
  }

  get appUrl(): string {
    return this.env.APP_URL;
  }

  get apiUrl(): string {
    return this.env.API_URL;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.env.REDIS_URL;
  }

  get corsOrigins(): readonly string[] {
    return this.env.CORS_ORIGINS;
  }

  get jwtAccessSecret(): string {
    return this.env.JWT_ACCESS_SECRET;
  }

  get jwtRefreshSecret(): string {
    return this.env.JWT_REFRESH_SECRET;
  }

  get jwtAccessExpiresIn(): string {
    return this.env.JWT_ACCESS_EXPIRES_IN;
  }

  get jwtRefreshExpiresIn(): string {
    return this.env.JWT_REFRESH_EXPIRES_IN;
  }

  get meilisearchHost(): string | undefined {
    return this.env.MEILISEARCH_HOST;
  }

  get meilisearchApiKey(): string | undefined {
    return this.env.MEILISEARCH_API_KEY;
  }

  get cloudinaryCloudName(): string | undefined {
    return this.env.CLOUDINARY_CLOUD_NAME;
  }

  get cloudinaryApiKey(): string | undefined {
    return this.env.CLOUDINARY_API_KEY;
  }

  get cloudinaryApiSecret(): string | undefined {
    return this.env.CLOUDINARY_API_SECRET;
  }

  get isCloudinaryConfigured(): boolean {
    return Boolean(
      this.cloudinaryCloudName && this.cloudinaryApiKey && this.cloudinaryApiSecret,
    );
  }

  /** Full validated env snapshot (read-only). */
  get raw(): Readonly<ApiEnv> {
    return this.env;
  }

  get cookieSecure(): boolean {
    return this.env.NODE_ENV === 'production' || this.env.NODE_ENV === 'staging';
  }

  get cookieSameSite(): 'strict' | 'lax' | 'none' {
    return 'lax';
  }
}

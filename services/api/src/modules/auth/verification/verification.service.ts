import { Injectable } from '@nestjs/common';
import { VerificationType } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { VERIFICATION_TOKEN_TTL_SECONDS } from '../auth.constants';

const VERIFICATION_REDIS_PREFIX = 'mp:verification:';

export interface VerificationTokenPayload {
  readonly userId: string;
  readonly type: VerificationType;
  readonly verificationRequestId: string;
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Email verification — token stored in Redis; request persisted for audit. */
  async createEmailVerification(userId: string): Promise<{ readonly token: string }> {
    return this.createVerification(userId, VerificationType.email);
  }

  /** Phone verification — same architecture as email. */
  async createPhoneVerification(userId: string, phone: string): Promise<{ readonly token: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { phone },
    });
    return this.createVerification(userId, VerificationType.phone);
  }

  async verifyToken(
    type: VerificationType,
    token: string,
  ): Promise<VerificationTokenPayload | null> {
    const hash = this.hashVerificationToken(token);
    const raw = await this.redis.get(`${VERIFICATION_REDIS_PREFIX}${type}:${hash}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as VerificationTokenPayload;
  }

  async consumeToken(type: VerificationType, token: string): Promise<VerificationTokenPayload | null> {
    const payload = await this.verifyToken(type, token);
    if (!payload) {
      return null;
    }
    const hash = this.hashVerificationToken(token);
    await this.redis.del(`${VERIFICATION_REDIS_PREFIX}${type}:${hash}`);
    await this.prisma.verificationRequest.update({
      where: { id: payload.verificationRequestId },
      data: { status: 'approved' },
    });
    return payload;
  }

  private async createVerification(
    userId: string,
    type: VerificationType,
  ): Promise<{ readonly token: string }> {
    const token = randomBytes(32).toString('base64url');
    const hash = this.hashVerificationToken(token);

    const request = await this.prisma.verificationRequest.create({
      data: {
        userId,
        type,
        status: 'pending',
        metadata: { channel: type, issuedAt: new Date().toISOString() },
      },
    });

    const payload: VerificationTokenPayload = {
      userId,
      type,
      verificationRequestId: request.id,
    };

    await this.redis.setex(
      `${VERIFICATION_REDIS_PREFIX}${type}:${hash}`,
      VERIFICATION_TOKEN_TTL_SECONDS,
      JSON.stringify(payload),
    );

    return { token };
  }

  private hashVerificationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

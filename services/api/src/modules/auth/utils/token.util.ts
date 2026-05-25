import { createHash, randomBytes, randomUUID } from 'node:crypto';

import ms from 'ms';

export function generateSessionId(): string {
  return randomUUID();
}

export function generateTokenId(): string {
  return randomUUID();
}

/** Opaque refresh token (stored hashed in Redis). */
export function generateOpaqueToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function parseDurationToSeconds(duration: string): number {
  const value = ms(duration);
  if (typeof value !== 'number' || value <= 0) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  return Math.floor(value / 1000);
}

export function parseDurationToMs(duration: string): number {
  const value = ms(duration);
  if (typeof value !== 'number' || value <= 0) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  return value;
}

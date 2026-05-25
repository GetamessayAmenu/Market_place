import type { CookieOptions, Response } from 'express';

import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
} from '../auth.constants';

export interface CookieSecurityOptions {
  readonly secure: boolean;
  readonly sameSite: 'strict' | 'lax' | 'none';
  readonly domain?: string;
}

function baseCookieOptions(security: CookieSecurityOptions): CookieOptions {
  return {
    httpOnly: true,
    secure: security.secure,
    sameSite: security.sameSite,
    ...(security.domain ? { domain: security.domain } : {}),
  };
}

export function setAccessTokenCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
  security: CookieSecurityOptions,
): void {
  res.cookie(COOKIE_ACCESS_TOKEN, token, {
    ...baseCookieOptions(security),
    maxAge: maxAgeMs,
    path: '/',
  });
}

export function setRefreshTokenCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
  security: CookieSecurityOptions,
): void {
  res.cookie(COOKIE_REFRESH_TOKEN, token, {
    ...baseCookieOptions(security),
    maxAge: maxAgeMs,
    path: '/api/v1/auth',
  });
}

export function clearAuthCookies(res: Response, security: CookieSecurityOptions): void {
  const opts = baseCookieOptions(security);
  res.clearCookie(COOKIE_ACCESS_TOKEN, { ...opts, path: '/' });
  res.clearCookie(COOKIE_REFRESH_TOKEN, { ...opts, path: '/api/v1/auth' });
}

export function extractRefreshToken(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[COOKIE_REFRESH_TOKEN];
}

export function extractAccessTokenFromCookies(
  cookies: Record<string, string | undefined>,
): string | undefined {
  return cookies[COOKIE_ACCESS_TOKEN];
}

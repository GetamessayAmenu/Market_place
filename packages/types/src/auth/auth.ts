import type { UserRole } from './rbac.js';

export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRole;
  readonly sessionId: string;
  readonly jti: string;
  readonly iat?: number;
  readonly exp?: number;
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly roles?: string[];
  readonly permissions?: string[];
  readonly isSuperAdmin?: boolean;
  readonly mfaEnabled?: boolean;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly emailVerified: boolean;
  readonly phoneVerified: boolean;
  readonly phone?: string | null;
  readonly bio?: string | null;
  readonly location?: string | null;
  readonly sellerType?: string | null;
  readonly socialLinks?: Record<string, any> | null;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly expiresIn: number;
}

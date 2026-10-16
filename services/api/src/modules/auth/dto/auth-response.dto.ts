import type { AuthTokens, AuthUser } from '@marketplace/types';

export interface AuthResponseDto {
  readonly user?: AuthUser;
  readonly tokens?: AuthTokens;
  readonly verification?: {
    readonly emailToken?: string;
  };
  readonly mfaRequired?: boolean;
  readonly mfaTicket?: string;
}

export interface MeResponseDto {
  readonly user: AuthUser;
}

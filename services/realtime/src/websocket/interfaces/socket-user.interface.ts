import type { UserRole } from '@marketplace/types';

export interface SocketUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly sessionId: string;
  readonly displayName: string;
  readonly status: string;
}

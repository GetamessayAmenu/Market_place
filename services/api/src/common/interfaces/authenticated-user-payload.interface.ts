import type { AuthenticatedUser } from './authenticated-user.interface';

/** User + RBAC without session context (completed by JWT strategy). */
export type AuthenticatedUserPayload = Omit<AuthenticatedUser, 'sessionId'>;

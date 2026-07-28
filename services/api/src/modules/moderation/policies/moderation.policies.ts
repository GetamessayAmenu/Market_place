import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

export function canModerateContent(user: AuthenticatedUser): boolean {
  return ['admin', 'super_admin', 'moderator', 'support'].includes(user.role);
}

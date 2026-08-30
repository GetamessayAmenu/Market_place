import type { ListingStatus } from '@marketplace/types';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

const SELLER_OWNED_STATUSES: readonly ListingStatus[] = [
  'draft',
  'pending_review',
  'changes_requested',
  'sold',
  'archived',
];

const MODERATOR_STATUSES: readonly ListingStatus[] = [
  'pending_review',
  'changes_requested',
  'active',
  'rejected',
  'archived',
  'expired',
];

export function canModerateListings(user: AuthenticatedUser): boolean {
  return user.permissions.some(
    (p) =>
      (p.resource === 'listing' && p.action === 'moderate') ||
      (p.resource === 'listing' && p.action === 'approve'),
  );
}

export function canManageListing(
  user: AuthenticatedUser,
  sellerId: string,
): boolean {
  if (user.id === sellerId) {
    return user.permissions.some(
      (p) => p.resource === 'listing' && (p.action === 'update' || p.action === 'delete'),
    );
  }
  return canModerateListings(user);
}

export function canSetListingStatus(
  user: AuthenticatedUser,
  sellerId: string,
  nextStatus: ListingStatus,
): boolean {
  if (canModerateListings(user)) {
    return MODERATOR_STATUSES.includes(nextStatus);
  }
  if (user.id !== sellerId) {
    return false;
  }
  return SELLER_OWNED_STATUSES.includes(nextStatus);
}

export function isPublicListingStatus(status: ListingStatus): boolean {
  return status === 'active';
}

/**
 * Evaluates the initial status for a newly submitted listing.
 *
 * Future scalability hooks:
 * - Trusted sellers / verified status: can auto-approve directly to 'active'.
 * - Suspicious / high-risk sellers: require prior seller approval or strict escalation.
 * - Automated moderation scoring: low risk -> 'active', medium risk -> 'pending_review', high risk -> 'rejected'.
 *
 * Current active rule: All normal seller listings go to 'pending_review'.
 */
export function determineInitialListingStatus(_seller: AuthenticatedUser): ListingStatus {
  return 'pending_review';
}

import type { ListingStatus } from '@marketplace/types';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

const SELLER_OWNED_STATUSES: readonly ListingStatus[] = [
  'draft',
  'pending_review',
  'active',
  'sold',
  'archived',
];

const MODERATOR_STATUSES: readonly ListingStatus[] = [
  'pending_review',
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

export const MODERATION_EVENTS = {
  APPROVED: 'moderation.approved',
  REJECTED: 'moderation.rejected',
  DELETED: 'moderation.deleted',
  RESTORED: 'moderation.restored',
  SPAM_FLAGGED: 'moderation.spam_flagged',
  SPAM_UNFLAGGED: 'moderation.spam_unflagged',
  BULK_ACTION: 'moderation.bulk_action',
} as const;

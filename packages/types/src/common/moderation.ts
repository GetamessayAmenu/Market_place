export const MODERATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'under_review',
  'deleted',
  'restored',
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const MODERATION_ITEM_TYPES = [
  'review',
  'product_image',
  'store_logo',
  'store_banner',
  'store_gallery',
  'custom_service_description',
  'custom_service_reference',
] as const;

export type ModerationItemType = (typeof MODERATION_ITEM_TYPES)[number];

export const MODERATION_STATUS_VALUES = MODERATION_STATUSES as unknown as string[];
export const MODERATION_ITEM_TYPE_VALUES = MODERATION_ITEM_TYPES as unknown as string[];

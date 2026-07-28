export const CONTENT_STATUSES = ['draft', 'published', 'scheduled', 'archived'] as const;
export const CONTENT_TYPES = ['hero_banner', 'featured_product', 'featured_rental', 'featured_custom_service', 'promotional_section', 'homepage_category'] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];

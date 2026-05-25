import { SEARCH_MAX_QUERY_LENGTH } from '@marketplace/config';

import type { SearchListingsDto } from '../dto/search-listings.dto';

/** Strip control chars and cap query length for abuse prevention. */
export function sanitizeSearchQuery(query: string | undefined): string {
  if (!query) {
    return '';
  }
  return query
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, SEARCH_MAX_QUERY_LENGTH);
}

export function buildMeilisearchFilter(dto: SearchListingsDto): string {
  const parts: string[] = ["status = 'active'"];

  if (dto.categoryId) {
    parts.push(`categoryId = '${escapeFilterValue(dto.categoryId)}'`);
  }

  if (dto.categorySlug) {
    parts.push(
      `(categorySlug = '${escapeFilterValue(dto.categorySlug)}' OR subcategorySlug = '${escapeFilterValue(dto.categorySlug)}')`,
    );
  }

  if (dto.city) {
    parts.push(`city = '${escapeFilterValue(dto.city)}'`);
  }

  if (dto.condition) {
    parts.push(`condition = '${escapeFilterValue(dto.condition)}'`);
  }

  if (dto.verified === true) {
    parts.push('verified = true');
  }

  if (dto.featured === true) {
    parts.push('featured = true');
  }

  if (dto.minPrice !== undefined) {
    parts.push(`price >= ${dto.minPrice}`);
  }

  if (dto.maxPrice !== undefined) {
    parts.push(`price <= ${dto.maxPrice}`);
  }

  return parts.join(' AND ');
}

export function buildMeilisearchSort(
  sortBy: SearchListingsDto['sortBy'],
): string[] | undefined {
  switch (sortBy) {
    case 'newest':
      return ['featured:desc', 'createdAt:desc'];
    case 'oldest':
      return ['createdAt:asc'];
    case 'price_asc':
      return ['price:asc'];
    case 'price_desc':
      return ['price:desc'];
    case 'relevance':
    default:
      return undefined;
  }
}

function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

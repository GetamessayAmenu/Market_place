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

  // Transaction Model Filters
  if (dto.supportsReadyMade === true) {
    parts.push('supportsReadyMade = true');
  }

  if (dto.availableForRent === true) {
    parts.push('availableForRent = true');
  }

  if (dto.supportsCustomDesign === true) {
    parts.push('supportsCustomDesign = true');
  }

  // Geographic Hub Filter
  if (dto.regionalHubId) {
    parts.push(`regionalHubId = '${escapeFilterValue(dto.regionalHubId)}'`);
  }

  if (dto.hubType) {
    parts.push(`hubType = '${escapeFilterValue(dto.hubType)}'`);
  }

  // Cultural Facet Filters
  if (dto.weavingPatterns && dto.weavingPatterns.length > 0) {
    const patternFilters = dto.weavingPatterns.map(p => `weavingPatterns = '${escapeFilterValue(p)}'`);
    parts.push(`(${patternFilters.join(' OR ')})`);
  }

  if (dto.fabricTypes && dto.fabricTypes.length > 0) {
    const fabricFilters = dto.fabricTypes.map(f => `fabricTypes = '${escapeFilterValue(f)}'`);
    parts.push(`(${fabricFilters.join(' OR ')})`);
  }

  if (dto.embroideryStyles && dto.embroideryStyles.length > 0) {
    const embroideryFilters = dto.embroideryStyles.map(e => `embroideryStyles = '${escapeFilterValue(e)}'`);
    parts.push(`(${embroideryFilters.join(' OR ')})`);
  }

  if (dto.occasionTypes && dto.occasionTypes.length > 0) {
    const occasionFilters = dto.occasionTypes.map(o => `occasionTypes = '${escapeFilterValue(o)}'`);
    parts.push(`(${occasionFilters.join(' OR ')})`);
  }

  // Verified Designer Filter
  if (dto.verifiedDesignerOnly === true) {
    parts.push('verifiedDesigner = true');
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

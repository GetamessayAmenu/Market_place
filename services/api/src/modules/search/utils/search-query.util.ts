import { SEARCH_MAX_QUERY_LENGTH } from '@marketplace/config';

import type { SearchListingsDto } from '../dto/search-listings.dto';

/** Strip control chars and cap query length for abuse prevention. */
export function sanitizeSearchQuery(query: string | undefined): string {
  if (!query) {
    return '';
  }
  return query
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\u2010-\u2015\u2013\u2014–—]/g, ' ')
    .replace(/[^\w\s\u00C0-\u024F\u1200-\u137F()'-]/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, SEARCH_MAX_QUERY_LENGTH);
}

export function parseNaturalQuery(rawQuery: string | undefined): {
  cleanQuery: string;
  inferredFilters: {
    maxPrice?: number;
    minPrice?: number;
    availableForRent?: boolean;
    supportsCustomDesign?: boolean;
    city?: string;
    occasionTypes?: string[];
  };
} {
  if (!rawQuery) {
    return { cleanQuery: '', inferredFilters: {} };
  }

  let text = rawQuery.trim();
  const inferredFilters: ReturnType<typeof parseNaturalQuery>['inferredFilters'] = {};

  // 1. Price intent parsing e.g. "under 5000", "below 3000 ETB"
  const underPriceMatch = text.match(/(?:under|below|less than|\<=?)\s*(\d+)(?:\s*etb|\s*birr)?/i);
  if (underPriceMatch && underPriceMatch[1]) {
    inferredFilters.maxPrice = Number.parseInt(underPriceMatch[1], 10);
    text = text.replace(underPriceMatch[0], '').trim();
  }

  // 2. Transaction intent parsing
  if (/\b(rent|rental|renting)\b/i.test(text)) {
    inferredFilters.availableForRent = true;
    text = text.replace(/\b(rent|rental|renting)\b/gi, '').trim();
  } else if (/\b(custom|custom-made|bespoke|tailored)\b/i.test(text)) {
    inferredFilters.supportsCustomDesign = true;
    text = text.replace(/\b(custom|custom-made|bespoke|tailored)\b/gi, '').trim();
  }

  // 3. Location intent parsing
  if (/\b(addis|addis ababa)\b/i.test(text)) {
    inferredFilters.city = 'Addis Ababa';
    text = text.replace(/\b(addis|addis ababa)\b/gi, '').trim();
  } else if (/\b(hawassa|hawasa)\b/i.test(text)) {
    inferredFilters.city = 'Hawassa';
    text = text.replace(/\b(hawassa|hawasa)\b/gi, '').trim();
  } else if (/\b(bahir dar|bahirdar)\b/i.test(text)) {
    inferredFilters.city = 'Bahir Dar';
    text = text.replace(/\b(bahir dar|bahirdar)\b/gi, '').trim();
  }

  // 4. Occasion intent parsing
  if (/\b(wedding|bridal)\b/i.test(text)) {
    inferredFilters.occasionTypes = ['Wedding', 'Bridal'];
  }

  return {
    cleanQuery: text.replace(/\s+/g, ' '),
    inferredFilters,
  };
}

export function buildMeilisearchFilter(dto: SearchListingsDto): string {
  const parts: string[] = ["status = 'active'"];

  // Run natural query parsing if query string exists
  const parsed = parseNaturalQuery(dto.q);
  const inferred = parsed.inferredFilters;

  if (dto.categoryId) {
    parts.push(`categoryId = '${escapeFilterValue(dto.categoryId)}'`);
  }

  if (dto.categorySlug) {
    parts.push(
      `(categorySlug = '${escapeFilterValue(dto.categorySlug)}' OR subcategorySlug = '${escapeFilterValue(dto.categorySlug)}')`,
    );
  }

  const effectiveCity = dto.city || inferred.city;
  if (effectiveCity) {
    parts.push(`city = '${escapeFilterValue(effectiveCity)}'`);
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

  const effectiveMinPrice = dto.minPrice !== undefined ? dto.minPrice : inferred.minPrice;
  if (effectiveMinPrice !== undefined) {
    parts.push(`price >= ${effectiveMinPrice}`);
  }

  const effectiveMaxPrice = dto.maxPrice !== undefined ? dto.maxPrice : inferred.maxPrice;
  if (effectiveMaxPrice !== undefined) {
    parts.push(`price <= ${effectiveMaxPrice}`);
  }

  // Transaction Model Filters
  if (dto.supportsReadyMade === true || dto.type === 'buy') {
    parts.push('supportsReadyMade = true');
  }

  if (dto.availableForRent === true || dto.type === 'rent' || inferred.availableForRent === true) {
    parts.push('availableForRent = true');
  }

  if (dto.supportsCustomDesign === true || dto.type === 'custom' || inferred.supportsCustomDesign === true) {
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

  const effectiveOccasions = (dto.occasionTypes && dto.occasionTypes.length > 0)
    ? dto.occasionTypes
    : inferred.occasionTypes;

  if (effectiveOccasions && effectiveOccasions.length > 0) {
    const occasionFilters = effectiveOccasions.map(o => `occasionTypes = '${escapeFilterValue(o)}'`);
    parts.push(`(${occasionFilters.join(' OR ')})`);
  }

  if ((dto as any).verifiedDesignerOnly === true) {
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

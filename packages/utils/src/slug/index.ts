const SLUG_PATTERN = /[^a-z0-9]+/g;

/**
 * Generate SEO-friendly URL slugs from arbitrary text.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(SLUG_PATTERN, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Append a short unique suffix for collision avoidance (e.g. listing slugs).
 */
export function slugifyWithSuffix(text: string, suffix: string): string {
  const base = slugify(text);
  const cleanSuffix = suffix.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8);
  return cleanSuffix ? `${base}-${cleanSuffix}` : base;
}

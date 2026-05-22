/**
 * Class name merger — Tailwind-aware merge will be wired in Phase 9 (clsx + tailwind-merge).
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

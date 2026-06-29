/**
 * Formatting utilities for the Ethiopian fashion marketplace dashboard.
 * Covers currency (ETB), relative time, privacy masking, and numbers.
 */

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Format a number as Ethiopian Birr.
 * Whole numbers: "ETB 1,500"  |  Decimals: "ETB 1,500.50"
 */
export function formatETB(amount: number): string {
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    currencyDisplay: 'code',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })
    .format(amount)
    .replace('ETB', 'ETB'); // keep as-is, just readable
}

/**
 * Format a number with comma thousands separator (e.g. 10000 → "10,000").
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Format a percentage change to 1 decimal place.
 * Returns "+12.5%" or "-3.2%" or "0.0%"
 */
export function formatPctChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

// ─── Relative Time ─────────────────────────────────────────────────────────────

/**
 * Human-readable relative time string.
 * e.g. "2m ago", "3h ago", "1d ago", "2w ago"
 */
export function formatRelativeTime(dateOrStr: Date | string): string {
  const date = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWk = Math.floor(diffDay / 7);
  const diffMo = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWk < 4) return `${diffWk}w ago`;
  return `${diffMo}mo ago`;
}

/**
 * Format a date as short date string "Jun 27, 2026".
 */
export function formatShortDate(dateOrStr: Date | string): string {
  const date = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format time as 12-hour with AM/PM, e.g. "2:30 PM".
 */
export function formatTime12h(dateOrStr: Date | string): string {
  const date = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Privacy Masking ──────────────────────────────────────────────────────────

/**
 * Mask full name to "First L." (first name + last initial).
 * e.g. "Abebe Kebede" → "Abebe K."
 */
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const firstName = parts[0]!;
  const lastInitial = parts[parts.length - 1]!.charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

/**
 * Mask email showing first 3 chars and domain.
 * e.g. "abebe.k@gmail.com" → "abe***@gmail.com"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

/**
 * Mask phone number showing only last 4 digits.
 * e.g. "+251911223344" → "***3344"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `***${digits.slice(-4)}`;
}

// ─── Duration ─────────────────────────────────────────────────────────────────

/**
 * Format hours as human-readable duration.
 * e.g. 1.5 → "1.5 hours"  |  0.5 → "30 minutes"  |  25 → "1 day 1 hour"
 */
export function formatHours(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  if (hours < 24) {
    return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days} ${days === 1 ? 'day' : 'days'}`;
}

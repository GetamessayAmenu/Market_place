const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'pass',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authsecret',
  'authorization',
  'creditcard',
  'cardnumber',
  'cvv',
  'pin',
  'privatekey',
  'otp',
  'sessionid',
]);

/**
 * Recursively redacts sensitive key-value pairs from audit payloads or metadata.
 */
export function sanitizeAuditPayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeAuditPayload(item)) as unknown as T;
  }

  if (input instanceof Date) {
    return input;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('token')) {
      sanitized[key] = '[REDACTED]';
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeAuditPayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Computes structured before/after diffs between two objects.
 * Output format:
 * {
 *   fieldName: { before: val1, after: val2 }
 * }
 */
export function computeChanges(
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined,
  allowedKeys?: string[],
): Record<string, { before: any; after: any }> | null {
  if (!before && !after) return null;

  const cleanBefore = sanitizeAuditPayload(before || {});
  const cleanAfter = sanitizeAuditPayload(after || {});

  const allKeys = allowedKeys && allowedKeys.length > 0
    ? allowedKeys
    : Array.from(new Set([...Object.keys(cleanBefore), ...Object.keys(cleanAfter)]));

  const changes: Record<string, { before: any; after: any }> = {};

  for (const key of allKeys) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;

    const valBefore = normalizeValue(cleanBefore[key]);
    const valAfter = normalizeValue(cleanAfter[key]);

    if (!isEqual(valBefore, valAfter)) {
      changes[key] = {
        before: valBefore,
        after: valAfter,
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

function normalizeValue(val: any): any {
  if (val === undefined) return null;
  if (val && typeof val === 'object' && 'toString' in val && typeof val.toString === 'function' && !Array.isArray(val) && !(val instanceof Date)) {
    // Handle Decimal or similar custom stringifiers
    if (typeof val.toNumber === 'function') return val.toNumber();
    return val.toString();
  }
  return val;
}

function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return String(a) === String(b);
}

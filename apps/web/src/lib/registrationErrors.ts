/**
 * Registration error types and parser.
 *
 * Translates raw API/network errors into structured, field-level
 * error information the registration form can render.
 */

/** Every field on the registration form that can carry an inline error. */
export type RegisterFieldName =
  | 'displayName'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirmPassword'
  | 'termsAccepted';

/** Categorised error kind — drives UI treatment and recovery path. */
export type RegisterErrorKind =
  | 'email_exists'
  | 'phone_exists'
  | 'weak_password'
  | 'invalid_verification'
  | 'network'
  | 'server'
  | 'rate_limited'
  | 'unknown';

/**
 * Structured registration error surfaced to the UI.
 *
 * - `kind`   — drives icons, colours, and recovery hints.
 * - `title`  — short, human-friendly headline shown in the banner.
 * - `message`— longer explanation with fix instructions.
 * - `fieldErrors` — per-field inline messages (when applicable).
 * - `retryable` — whether a "Try again" action makes sense.
 */
export interface RegisterError {
  readonly kind: RegisterErrorKind;
  readonly title: string;
  readonly message: string;
  readonly fieldErrors: Partial<Record<RegisterFieldName, string>>;
  readonly retryable: boolean;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

interface ApiErrorBody {
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
    readonly details?: Record<string, unknown>;
  };
  readonly message?: string;
  readonly statusCode?: number;
}

/** Axios-like error shape. */
interface AxiosLikeError {
  readonly response?: {
    readonly status?: number;
    readonly data?: ApiErrorBody;
  };
  readonly code?: string; // 'ECONNABORTED' | 'ERR_NETWORK' | ...
  readonly message?: string;
}

/** Map backend error codes → RegisterErrorKind. */
const CODE_TO_KIND: Record<string, RegisterErrorKind> = {
  EMAIL_ALREADY_REGISTERED: 'email_exists',
  PHONE_ALREADY_REGISTERED: 'phone_exists',
  WEAK_PASSWORD: 'weak_password',
  INVALID_VERIFICATION_CODE: 'invalid_verification',
  RATE_LIMIT_EXCEEDED: 'rate_limited',
  INTERNAL_SERVER_ERROR: 'server',
};

/**
 * Attempt to extract structured field errors from DTO validation
 * responses (NestJS class-validator 400 errors).
 *
 * NestJS returns `message` as an array of strings like:
 *   ["email must be an email", "password must be longer than 7 characters"]
 *
 * We map these to specific form fields where possible.
 */
function parseDtoValidationMessages(data: ApiErrorBody): Partial<Record<RegisterFieldName, string>> {
  const fieldErrors: Partial<Record<RegisterFieldName, string>> = {};

  // NestJS class-validator puts messages in data.error.details?.message or
  // directly in data.error.message as a joined string.
  const details = data.error?.details;
  const rawMessages =
    Array.isArray(details?.message)
      ? (details.message as string[])
      : typeof data.error?.message === 'string'
        ? data.error.message.split('; ')
        : [];

  for (const msg of rawMessages) {
    const lower = msg.toLowerCase();
    if (lower.includes('email')) {
      fieldErrors.email = msg;
    } else if (lower.includes('password') && lower.includes('must')) {
      fieldErrors.password = msg;
    } else if (lower.includes('phone')) {
      fieldErrors.phone = msg;
    } else if (lower.includes('displayname') || lower.includes('display name') || lower.includes('name')) {
      fieldErrors.displayName = msg;
    }
  }

  return fieldErrors;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Parse any error thrown during registration into a structured
 * `RegisterError` the UI can render.
 *
 * Handles:
 * - Backend error codes (EMAIL_ALREADY_REGISTERED, PHONE_ALREADY_REGISTERED, etc.)
 * - DTO validation errors (400 Bad Request)
 * - Network / offline errors
 * - Server errors (5xx)
 * - Rate limiting (429)
 * - Unknown / unexpected errors
 */
export function parseRegisterError(raw: unknown): RegisterError {
  const err = raw as AxiosLikeError;

  // ── Network / offline ──────────────────────────────────────────
  if (!err.response) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return {
      kind: 'network',
      title: isOffline ? 'You appear to be offline' : 'Connection problem',
      message: isOffline
        ? 'Check your internet connection and try again. Your information has been saved — nothing was lost.'
        : 'We could not reach our servers. This usually means a slow or dropped connection. Please check your internet and try again.',
      fieldErrors: {},
      retryable: true,
    };
  }

  const status = err.response.status ?? 0;
  const data = err.response.data ?? {};
  const code = data.error?.code ?? '';

  // ── Rate limiting (429) ────────────────────────────────────────
  if (status === 429 || code === 'RATE_LIMIT_EXCEEDED') {
    return {
      kind: 'rate_limited',
      title: 'Too many attempts',
      message:
        'You have tried to create an account too many times in a short period. Please wait a minute and try again.',
      fieldErrors: {},
      retryable: true,
    };
  }

  // ── DTO validation (400 Bad Request) ───────────────────────────
  if (status === 400) {
    const fieldErrors = parseDtoValidationMessages(data);
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;
    return {
      kind: 'weak_password', // best-guess; most 400s on register are password-related
      title: hasFieldErrors ? 'Please fix the highlighted fields' : 'Invalid information',
      message: hasFieldErrors
        ? 'Some of the information you entered needs to be corrected. See details below.'
        : data.error?.message ?? 'The information you entered could not be accepted. Please review the form and try again.',
      fieldErrors,
      retryable: true,
    };
  }

  // ── Known error codes ──────────────────────────────────────────
  const kind = CODE_TO_KIND[code] ?? 'unknown';

  switch (kind) {
    case 'email_exists':
      return {
        kind,
        title: 'This email is already registered',
        message:
          'An account with this email already exists. Try signing in instead, or use a different email address.',
        fieldErrors: {
          email: 'This email is already in use. Try a different one or sign in.',
        },
        retryable: false,
      };

    case 'phone_exists':
      return {
        kind,
        title: 'This phone number is already registered',
        message:
          'Another account is already linked to this phone number. Please use a different number or leave it blank.',
        fieldErrors: {
          phone: 'This phone number is already in use. Try a different one or remove it.',
        },
        retryable: false,
      };

    case 'weak_password':
      return {
        kind,
        title: 'Password does not meet requirements',
        message:
          'Your password needs at least 8 characters, one uppercase letter, and one number. Please choose a stronger password.',
        fieldErrors: {
          password: 'Password needs 8+ characters, one uppercase letter, and one number.',
        },
        retryable: true,
      };

    case 'invalid_verification':
      return {
        kind,
        title: 'Verification code is invalid',
        message:
          'The verification code you entered is incorrect or has expired. Please request a new code and try again.',
        fieldErrors: {},
        retryable: true,
      };

    case 'server':
      return {
        kind,
        title: 'Something went wrong on our end',
        message:
          'We are experiencing technical difficulties. Your information has not been saved. Please try again in a few moments.',
        fieldErrors: {},
        retryable: true,
      };

    default: {
      // ── Server errors (5xx) ────────────────────────────────────
      if (status >= 500) {
        return {
          kind: 'server',
          title: 'Something went wrong on our end',
          message:
            'We are experiencing technical difficulties. Your information has not been saved. Please try again in a few moments.',
          fieldErrors: {},
          retryable: true,
        };
      }

      // ── Fallback: use server message if available, otherwise generic ──
      const serverMessage = data.error?.message ?? data.message;
      return {
        kind: 'unknown',
        title: 'We could not create your account',
        message: serverMessage
          ? `${serverMessage}. Please review your information and try again.`
          : 'Something unexpected happened. Please check your information and try again. If the problem continues, try again later.',
        fieldErrors: {},
        retryable: true,
      };
    }
  }
}

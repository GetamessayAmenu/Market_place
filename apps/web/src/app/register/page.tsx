"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormInput, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrength from '../../components/auth/PasswordStrength';
import UserTypeSelector, { type UserType } from '../../components/auth/UserTypeSelector';
import AuthLayout from '../../components/layouts/AuthLayout';
import useAuth from '../../hooks/useAuth';
import { register as clientRegister } from '../../lib/authClient';
import { parseRegisterError, type RegisterError, type RegisterFieldName } from '../../lib/registrationErrors';
import { registerSchema, type RegisterInput } from '../../lib/validation';

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (accessible, no extra dependency)                */
/* ------------------------------------------------------------------ */

function IconWarning({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconXCircle({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconWifiOff({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function IconServer({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function IconRefresh({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Error Banner                                                       */
/* ------------------------------------------------------------------ */

/** Visual config per error kind. */
const ERROR_STYLES = {
  email_exists: {
    bg: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100',
    icon: IconXCircle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  phone_exists: {
    bg: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100',
    icon: IconXCircle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  weak_password: {
    bg: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100',
    icon: IconWarning,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  invalid_verification: {
    bg: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100',
    icon: IconWarning,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  rate_limited: {
    bg: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100',
    icon: IconWarning,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  network: {
    bg: 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-100',
    icon: IconWifiOff,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  server: {
    bg: 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/40 dark:border-red-700 dark:text-red-100',
    icon: IconServer,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  unknown: {
    bg: 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/40 dark:border-red-700 dark:text-red-100',
    icon: IconWarning,
    iconColor: 'text-red-600 dark:text-red-400',
  },
} as const;

function RegistrationErrorBanner({
  error,
  onRetry,
  onDismiss,
  isRetrying,
  loginLink,
}: {
  error: RegisterError;
  onRetry: () => void;
  onDismiss: () => void;
  isRetrying: boolean;
  loginLink: string;
}) {
  const style = ERROR_STYLES[error.kind];
  const Icon = style.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative rounded-lg border p-4 ${style.bg}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${style.iconColor}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug">{error.title}</h3>
          <p className="mt-1 text-sm opacity-90 leading-relaxed">{error.message}</p>

          {/* Contextual action links */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Retry button for retryable errors */}
            {error.retryable && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 rounded-md bg-white/80 dark:bg-black/20 border border-current/20 px-3 py-1.5 text-xs font-medium hover:bg-white dark:hover:bg-black/30 transition-colors disabled:opacity-50"
              >
                {isRetrying ? (
                  <Spinner size="sm" />
                ) : (
                  <IconRefresh className="h-3.5 w-3.5" />
                )}
                {isRetrying ? 'Retrying...' : 'Try again'}
              </button>
            )}

            {/* Sign-in link for email_exists */}
            {error.kind === 'email_exists' && (
              <Link
                href={loginLink}
                className="inline-flex items-center rounded-md bg-white/80 dark:bg-black/20 border border-current/20 px-3 py-1.5 text-xs font-medium hover:bg-white dark:hover:bg-black/30 transition-colors"
              >
                Sign in instead
              </Link>
            )}

            {/* Remove phone hint for phone_exists */}
            {error.kind === 'phone_exists' && (
              <span className="text-xs opacity-75">
                Tip: Phone is optional — you can leave it blank.
              </span>
            )}
          </div>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss error"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Offline Banner                                                     */
/* ------------------------------------------------------------------ */

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() { setIsOffline(false); }
    function handleOffline() { setIsOffline(true); }

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100"
    >
      <IconWifiOff className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <span>You are currently offline. Your form data is saved — submit when you are back online.</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Register Form                                                      */
/* ------------------------------------------------------------------ */

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: 'buyer',
      termsAccepted: undefined as unknown as true,
    },
  });

  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);

  const [regError, setRegError] = useState<RegisterError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const passwordValue = watch('password');
  const userTypeValue = watch('userType');

  /** Core submit handler — called by form submit AND retry button. */
  const onSubmit = useCallback(
    async (data: RegisterInput) => {
      setRegError(null);
      clearErrors();
      setIsSubmitting(true);

      try {
        const payload: {
          email: string;
          password: string;
          displayName: string;
          phone?: string;
          userType?: 'buyer' | 'seller';
        } = {
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          userType: data.userType,
        };
        if (data.phone) {
          payload.phone = data.phone;
        }
        const res = await clientRegister(payload);
        setUser(res.user);
        router.push('/verify-email');
      } catch (e: unknown) {
        const parsed = parseRegisterError(e);
        setRegError(parsed);

        // Propagate field-level errors into react-hook-form so inputs
        // get highlighted with the red ring + inline message.
        for (const [field, msg] of Object.entries(parsed.fieldErrors)) {
          if (msg) {
            setError(field as RegisterFieldName, { type: 'server', message: msg });
          }
        }

        setIsSubmitting(false);
      }
    },
    [clearErrors, router, setError, setUser],
  );

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  /** Retry using current form values. */
  const handleRetry = useCallback(() => {
    void handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const loginLink = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : '/login';

  return (
    <AuthLayout title="Create account" subtitle="Join Habesha Market to buy and sell locally">
      <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
        {/* Offline banner */}
        <OfflineBanner />

        {/* Error banner */}
        {regError && (
          <RegistrationErrorBanner
            error={regError}
            onRetry={handleRetry}
            onDismiss={() => { setRegError(null); }}
            isRetrying={isSubmitting}
            loginLink={loginLink}
          />
        )}

        <UserTypeSelector
          value={userTypeValue}
          onChange={(type: UserType) => { setValue('userType', type) }}
          disabled={isSubmitting}
        />

        <FormInput
          label="Full Name"
          autoComplete="name"
          {...register('displayName')}
          {...(errors.displayName?.message !== undefined && { error: errors.displayName.message })}
        />

        <FormInput
          label="Email"
          type="email"
          autoComplete="email"
          {...register('email')}
          {...(errors.email?.message !== undefined && { error: errors.email.message })}
        />

        <FormInput
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="09XXXXXXXX or +2519XXXXXXXX"
          {...register('phone')}
          {...(errors.phone?.message !== undefined && { error: errors.phone.message })}
        />

        <div className="space-y-2">
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            {...register('password')}
            {...(errors.password?.message !== undefined && { error: errors.password.message })}
          />
          <PasswordStrength password={passwordValue} />
        </div>

        <PasswordInput
          label="Confirm Password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          {...(errors.confirmPassword?.message !== undefined && { error: errors.confirmPassword.message })}
        />

        <div className="flex items-start gap-2 pt-1">
          <input
            id="terms"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onChange={(e) => {
              setTermsError(!e.target.checked);
              setValue('termsAccepted', e.target.checked as true, { shouldValidate: true });
            }}
          />
          <label htmlFor="terms" className="text-sm text-foreground cursor-pointer select-none">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline" target="_blank">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </label>
        </div>
        {termsError && (
          <p className="text-xs text-destructive -mt-2" role="alert">
            You must accept the terms to continue
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href={loginLink} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

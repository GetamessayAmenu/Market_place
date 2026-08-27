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

type Step = 'account' | 'success';

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);

  const [step, setStep] = useState<Step>('account');
  const [regError, setRegError] = useState<RegisterError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const {
    register: registerBuyer,
    handleSubmit: handleSubmitBuyer,
    setValue: setValueBuyer,
    watch: watchBuyer,
    setError: setErrorBuyer,
    clearErrors: clearErrorsBuyer,
    setFocus,
    formState: { errors: buyerErrors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: 'buyer',
      termsAccepted: undefined as unknown as true,
    },
  });

  const [userType, setUserType] = useState<UserType>('buyer');
  const passwordValue = watchBuyer('password');

  /** Buyer registration submit handler */
  const onBuyerSubmit = useCallback(
    async (data: RegisterInput) => {
      setRegError(null);
      clearErrorsBuyer();
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
        setStep('success');
      } catch (e: unknown) {
        const parsed = parseRegisterError(e);
        setRegError(parsed);

        for (const [field, msg] of Object.entries(parsed.fieldErrors)) {
          if (msg) {
            setErrorBuyer(field as RegisterFieldName, { type: 'server', message: msg });
          }
        }

        setIsSubmitting(false);
      }
    },
    [clearErrorsBuyer, setErrorBuyer, setUser],
  );

  /** Seller registration submit handler */
  const onSellerSubmit = async (data: RegisterInput) => {
    setRegError(null);
    setIsSubmitting(true);
    try {
      const payload: {
        email: string;
        password: string;
        displayName: string;
        phone?: string;
        userType?: 'buyer' | 'seller';
      } = {
        userType: 'seller',
        displayName: data.displayName,
        email: data.email,
        password: data.password,
      };
      if (data.phone) {
        payload.phone = data.phone;
      }
      const res = await clientRegister(payload);
      setUser(res.user);
      setStep('success');
    } catch (e: unknown) {
      const parsed = parseRegisterError(e);
      setRegError(parsed);

      for (const [field, msg] of Object.entries(parsed.fieldErrors)) {
        if (msg) {
          setErrorBuyer(field as RegisterFieldName, { type: 'server', message: msg });
        }
      }

      setIsSubmitting(false);
    }
  };

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (userType === 'seller') {
      void handleSubmitBuyer(onSellerSubmit)(e);
    } else {
      void handleSubmitBuyer(onBuyerSubmit)(e);
    }
  };

  /** Retry using current form values. */
  const handleRetry = useCallback(() => {
    if (userType === 'seller') {
      void handleSubmitBuyer(onSellerSubmit)();
    } else {
      void handleSubmitBuyer(onBuyerSubmit)();
    }
  }, [userType, handleSubmitBuyer, onBuyerSubmit, onSellerSubmit]);

  const loginLink = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : '/login';

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    setValueBuyer('userType', type);
  };

  useEffect(() => {
    setFocus('displayName');
  }, [setFocus]);

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
          value={userType}
          onChange={handleUserTypeChange}
          disabled={isSubmitting}
        />

        {userType === 'seller' && (
          <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-lg p-3 text-sm">
            <p className="font-medium text-foreground mb-1">📋 Seller Account</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• Your name will be displayed on your shop profile</li>
              <li>• Phone number is used for order notifications</li>
              <li>• Listings are reviewed by moderators before going public</li>
            </ul>
          </div>
        )}

        {step === 'account' && (
          <>
            <FormInput
              label="Full Name"
              autoComplete="name"
              {...registerBuyer('displayName')}
              {...(buyerErrors.displayName?.message !== undefined && { error: buyerErrors.displayName.message })}
            />
            {userType === 'seller' && (
              <p className="text-xs text-muted-foreground -mt-2">
                Enter your legal name as it appears on your ID card
              </p>
            )}

            <FormInput
              label="Email"
              type="email"
              autoComplete="email"
              {...registerBuyer('email')}
              {...(buyerErrors.email?.message !== undefined && { error: buyerErrors.email.message })}
            />

            <FormInput
              label={userType === 'seller' ? 'Phone Number' : 'Phone (optional)'}
              type="tel"
              autoComplete="tel"
              placeholder="09XXXXXXXX or +2519XXXXXXXX"
              {...registerBuyer('phone')}
              {...(buyerErrors.phone?.message !== undefined && { error: buyerErrors.phone.message })}
            />

            <div className="space-y-2">
              <PasswordInput
                label="Password"
                autoComplete="new-password"
                {...registerBuyer('password')}
                {...(buyerErrors.password?.message !== undefined && { error: buyerErrors.password.message })}
              />
              <PasswordStrength password={passwordValue} />
              {userType === 'seller' && (
                <p className="text-xs text-muted-foreground">
                  Use a strong password to protect your seller account and earnings
                </p>
              )}
            </div>

            <PasswordInput
              label="Confirm Password"
              autoComplete="new-password"
              {...registerBuyer('confirmPassword')}
              {...(buyerErrors.confirmPassword?.message !== undefined && { error: buyerErrors.confirmPassword.message })}
            />

            <div className="flex items-start gap-2 pt-1">
              <input
                id="terms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onChange={(e) => {
                  setTermsError(!e.target.checked);
                  setValueBuyer('termsAccepted', e.target.checked as true, { shouldValidate: true });
                }}
              />
              <label htmlFor="terms" className="text-sm text-foreground cursor-pointer select-none">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </Link>
                {userType === 'seller' && (
                  <>
                    {' '}
                    and{' '}
                    <Link href="/seller-agreement" className="text-primary hover:underline" target="_blank">
                      Seller Agreement
                    </Link>
                  </>
                )}
                {' '}and{' '}
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
          </>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
              <p className="text-muted-foreground">
                {userType === 'seller' 
                  ? 'Your seller account is ready. Start listing your first item.' 
                  : 'Your account has been created successfully.'}
              </p>
            </div>
            <div className="space-y-3">
              {userType === 'seller' ? (
                <>
                  <Button onClick={() => router.push('/setup/seller-type')} className="w-full">
                    Set Up Seller Account
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/search')} className="w-full">
                    Skip & Explore
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => router.push('/search')} className="w-full">
                    Start Exploring
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
                    Go to Dashboard
                  </Button>
                </>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">💡 Tip</p>
              <p className="text-muted-foreground">
                {userType === 'seller' 
                  ? 'Complete your profile to boost buyer trust and sell faster.' 
                  : 'Complete your profile to get personalized recommendations.'}
              </p>
            </div>
          </div>
        )}
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

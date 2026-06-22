"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormInput, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import ResendButton from '../../components/auth/ResendButton';
import AuthLayout from '../../components/layouts/AuthLayout';
import { forgotPassword } from '../../lib/authClient';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../../lib/validation';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  async function onSubmit(data: ForgotPasswordInput) {
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    }
    setIsSubmitting(false);
  }

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  async function handleResend() {
    await forgotPassword(submittedEmail);
  }

  const loginLink = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : '/login';

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a password reset link">
        <div className="space-y-6">
          {/* Email icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
              <svg className="h-8 w-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <Alert variant="info">
            If an account exists with <strong>{submittedEmail}</strong>, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
          </Alert>

          <ResendButton
            onResend={handleResend}
            label="Resend reset email"
            cooldownSeconds={60}
            maxAttempts={3}
          />

          <div className="text-center">
            <Link href={loginLink} className="text-sm font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={onFormSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => { setError(null) }}>
            {error}
          </Alert>
        )}
        <FormInput
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
          {...(errors.email?.message !== undefined && { error: errors.email.message })}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Sending...
            </span>
          ) : (
            'Send reset link'
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href={loginLink} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}

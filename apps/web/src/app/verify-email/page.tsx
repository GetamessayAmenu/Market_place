"use client"
import { Alert, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

import ResendButton from '../../components/auth/ResendButton';
import AuthLayout from '../../components/layouts/AuthLayout';
import { apiPost } from '../../lib/api';
import { resendVerificationEmail } from '../../lib/authClient';

type VerifyStatus = 'loading' | 'success' | 'error' | 'no-token';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<VerifyStatus>(token ? 'loading' : 'no-token');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        await apiPost('/auth/verify/email', { token });
        setStatus('success');
        setMessage('Your email has been verified successfully. You can now sign in.');
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setStatus('error');
        setMessage(err.response?.data?.message ?? 'Verification failed. The link may have expired.');
      }
    })();
  }, [token]);

  async function handleResend() {
    await resendVerificationEmail();
  }

  if (status === 'no-token') {
    return (
      <AuthLayout title="Verify your email" subtitle="Check your inbox for a verification link">
        <div className="space-y-6">
          {/* Mail icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10">
              <svg className="h-8 w-8 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <Alert variant="info">
            We sent a verification email when you registered. Click the link in that email to verify your account.
          </Alert>

          <ResendButton
            onResend={handleResend}
            label="Resend verification email"
            cooldownSeconds={60}
            maxAttempts={3}
          />

          <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'loading') {
    return (
      <AuthLayout title="Verifying email" subtitle="Please wait while we verify your email address...">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Verifying your email...</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email verified" subtitle="Your email has been verified">
        <div className="space-y-6">
          {/* Success icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
              <svg className="h-8 w-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <Alert variant="success">{message}</Alert>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue to sign in
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verification failed" subtitle="Something went wrong">
      <div className="space-y-6">
        {/* Error icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <Alert variant="error">{message}</Alert>

        <div className="text-center space-y-3">
          <Link href="/forgot-password" className="block text-sm font-medium text-primary hover:underline">
            Request new verification email
          </Link>
          <Link href="/login" className="block text-sm text-muted-foreground hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

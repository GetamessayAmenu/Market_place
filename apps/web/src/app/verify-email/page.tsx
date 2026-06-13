"use client"
import { Alert, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

import AuthLayout from '../../components/layouts/AuthLayout';
import { apiPost } from '../../lib/api';

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
        setMessage('Your email has been verified successfully.');
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setStatus('error');
        setMessage(err.response?.data?.message ?? 'Verification failed. The link may have expired.');
      }
    })();
  }, [token]);

  if (status === 'no-token') {
    return (
      <AuthLayout title="Verify your email" subtitle="Check your inbox for a verification link">
        <div className="space-y-4">
          <Alert variant="info">
            We sent a verification email when you registered. Click the link in that email to verify your account.
          </Alert>
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
      <AuthLayout title="Verifying email" subtitle="Please wait...">
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email verified" subtitle="Your email has been verified">
        <div className="space-y-4">
          <Alert variant="success">{message}</Alert>
          <div className="text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Continue to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verification failed" subtitle="Something went wrong">
      <div className="space-y-4">
        <Alert variant="error">{message}</Alert>
        <div className="text-center space-y-2">
          <Link href="/forgot-password" className="block text-sm font-medium text-primary hover:underline">
            Request new verification
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

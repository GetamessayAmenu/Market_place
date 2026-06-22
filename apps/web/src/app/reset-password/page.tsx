"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';

import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrength from '../../components/auth/PasswordStrength';
import AuthLayout from '../../components/layouts/AuthLayout';
import { resetPassword } from '../../lib/authClient';
import { resetPasswordSchema, type ResetPasswordInput } from '../../lib/validation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValue = watch('password');

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is invalid or has expired">
        <div className="space-y-6">
          {/* Warning icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>

          <Alert variant="error">
            The reset link is missing a valid token. Please request a new one.
          </Alert>

          <div className="text-center">
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Request new reset link
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  async function onSubmit(data: ResetPasswordInput) {
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(token, data.password);
      router.push('/login?reset=success');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Password reset failed. The link may have expired.');
      setIsSubmitting(false);
    }
  }

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password below">
      <form onSubmit={onFormSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => { setError(null) }}>
            {error}
          </Alert>
        )}

        <div className="space-y-2">
          <PasswordInput
            label="New Password"
            autoComplete="new-password"
            autoFocus
            {...register('password')}
            {...(errors.password?.message !== undefined && { error: errors.password.message })}
          />
          <PasswordStrength password={passwordValue} />
        </div>

        <PasswordInput
          label="Confirm New Password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          {...(errors.confirmPassword?.message !== undefined && { error: errors.confirmPassword.message })}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Resetting...
            </span>
          ) : (
            'Reset password'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

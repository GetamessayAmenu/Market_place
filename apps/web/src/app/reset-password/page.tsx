"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormInput, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import AuthLayout from '../../components/layouts/AuthLayout';
import { resetPassword } from '../../lib/authClient';

const resetFormSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormInput = z.infer<typeof resetFormSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormInput>({
    resolver: zodResolver(resetFormSchema),
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is invalid or has expired">
        <div className="space-y-4">
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

  async function onSubmit(data: ResetFormInput) {
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
        <FormInput
          label="New Password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          {...(errors.password?.message !== undefined && { error: errors.password.message })}
        />
        <FormInput
          label="Confirm New Password"
          type="password"
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

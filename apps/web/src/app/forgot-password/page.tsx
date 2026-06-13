"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormInput, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import AuthLayout from '../../components/layouts/AuthLayout';
import { forgotPassword } from '../../lib/authClient';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../../lib/validation';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: ForgotPasswordInput) {
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(data.email);
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

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a password reset link">
        <div className="space-y-4">
          <Alert variant="success">
            If an account exists with that email, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
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
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

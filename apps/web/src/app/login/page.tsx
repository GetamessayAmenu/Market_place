"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormInput, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import AuthLayout from '../../components/layouts/AuthLayout';
import useAuth from '../../hooks/useAuth';
import { login as clientLogin } from '../../lib/authClient';
import { loginSchema, type LoginInput } from '../../lib/validation';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: LoginInput) {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await clientLogin(data.email, data.password);
      setUser(res.user);
      router.push('/dashboard');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Invalid email or password. Please try again.');
      setIsSubmitting(false);
    }
  }

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to Marketplace">
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
        <FormInput
          label="Password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          {...(errors.password?.message !== undefined && { error: errors.password.message })}
        />
        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

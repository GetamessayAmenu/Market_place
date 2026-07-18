"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Checkbox, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import PasswordInput from '../../components/auth/PasswordInput';
import AuthLayout from '../../components/layouts/AuthLayout';
import useAuth from '../../hooks/useAuth';
import { login as clientLogin } from '../../lib/authClient';
import { loginSchema, type LoginInput } from '../../lib/validation';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/admin dashboard';
  const showResetSuccess = searchParams.get('reset') === 'success';

  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetBanner, setResetBanner] = useState(showResetSuccess);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  async function onSubmit(data: LoginInput) {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await clientLogin(data.email, data.password);
      setUser(res.user);
      
      // Role-based redirect
      let targetRedirect = redirect;
      if (redirect === '/dashboard') {
        // If default redirect, determine based on role
        if (res.user.role === 'seller') {
          targetRedirect = '/dashboard/seller';
        } else if (res.user.role === 'buyer') {
          targetRedirect = '/dashboard/custom-orders';
        } else {
          targetRedirect = '/dashboard';
        }
      }
      
      router.push(targetRedirect);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Invalid email or password. Please try again.');
      setIsSubmitting(false);
    }
  }

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  const registerLink = redirect !== '/dashboard'
    ? `/register?redirect=${encodeURIComponent(redirect)}`
    : '/register';

  const forgotLink = redirect !== '/dashboard'
    ? `/forgot-password?redirect=${encodeURIComponent(redirect)}`
    : '/forgot-password';

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to Habesha Market">
      <form onSubmit={onFormSubmit} className="space-y-4">
        {resetBanner && (
          <Alert variant="success" onDismiss={() => { setResetBanner(false) }}>
            Your password has been reset successfully. Please sign in with your new password.
          </Alert>
        )}
        {error && (
          <Alert variant="error" onDismiss={() => { setError(null) }}>
            {error}
          </Alert>
        )}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register('email')}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 ${errors.email ? 'border-destructive' : 'border-input'}`}
            aria-invalid={!!errors.email}
            {...(errors.email?.message !== undefined && { 'aria-describedby': 'email-error' })}
          />
          {errors.email?.message !== undefined && (
            <p id="email-error" className="text-xs text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          {...register('password')}
          {...(errors.password?.message !== undefined && { error: errors.password.message })}
        />
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={rememberMe} onChange={(e) => { setRememberMe(e.target.checked) }} />
          <Link href={forgotLink} className="text-sm text-primary hover:underline">
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
          <Link href={registerLink} className="font-medium text-primary hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

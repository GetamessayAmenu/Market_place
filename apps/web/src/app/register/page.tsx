"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormInput, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import AuthLayout from '../../components/layouts/AuthLayout';
import useAuth from '../../hooks/useAuth';
import { register as clientRegister } from '../../lib/authClient';
import { registerSchema, type RegisterInput } from '../../lib/validation';

export default function RegisterPage() {
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: RegisterInput) {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: { email: string; password: string; displayName: string; phone?: string } = {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      };
      if (data.phone) {
        payload.phone = data.phone;
      }
      const res = await clientRegister(payload);
      setUser(res.user);
      router.push('/verify-email');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  }

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  return (
    <AuthLayout title="Create account" subtitle="Join Marketplace to buy and sell locally">
      <form onSubmit={onFormSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => { setError(null) }}>
            {error}
          </Alert>
        )}
        <FormInput
          label="Full Name"
          autoComplete="name"
          {...formRegister('displayName')}
          {...(errors.displayName?.message !== undefined && { error: errors.displayName.message })}
        />
        <FormInput
          label="Email"
          type="email"
          autoComplete="email"
          {...formRegister('email')}
          {...(errors.email?.message !== undefined && { error: errors.email.message })}
        />
        <FormInput
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+1234567890"
          {...formRegister('phone')}
          {...(errors.phone?.message !== undefined && { error: errors.phone.message })}
        />
        <FormInput
          label="Password"
          type="password"
          autoComplete="new-password"
          {...formRegister('password')}
          {...(errors.password?.message !== undefined && { error: errors.password.message })}
        />
        <FormInput
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          {...formRegister('confirmPassword')}
          {...(errors.confirmPassword?.message !== undefined && { error: errors.confirmPassword.message })}
        />
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
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

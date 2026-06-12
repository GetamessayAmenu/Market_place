"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormInput } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';

import AuthLayout from '../../components/layouts/AuthLayout';
import useAuth from '../../hooks/useAuth';
import { login as clientLogin } from '../../lib/authClient';
import { loginSchema, type LoginInput } from '../../lib/validation';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  })
  const router = useRouter()
  const setUser = useAuth((s) => s.setUser)

  async function onSubmit(data: LoginInput) {
    try {
      const res = await clientLogin(data.email, data.password) as { data?: { id: string; name?: string; email?: string } }
      if (res.data) {
        setUser(res.data)
        router.push('/dashboard')
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error ?? 'Login failed')
    }
  }

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to Marketplace">
      <form onSubmit={onFormSubmit} className="space-y-4">
        <FormInput
          label="Email"
          type="email"
          {...register('email')}
          {...(errors.email?.message !== undefined && { error: errors.email.message })}
        />
        <FormInput
          label="Password"
          type="password"
          {...register('password')}
          {...(errors.password?.message !== undefined && { error: errors.password.message })}
        />
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}

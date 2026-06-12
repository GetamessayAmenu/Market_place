"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { login as clientLogin } from '../../lib/authClient'
import useAuth from '../../hooks/useAuth'
import { AuthLayout } from '../../components/layouts/AuthLayout'
import { FormInput, Button } from '@marketplace/ui'
import { loginSchema } from '../../lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'

type FormData = { email: string; password: string }

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(loginSchema)
  })
  const router = useRouter()
  const setUser = useAuth((s) => s.setUser)

  async function onSubmit(data: FormData) {
    try {
      const res = await clientLogin(data.email, data.password)
      if (res?.data) {
        setUser(res.data)
        router.push('/dashboard')
      }
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to Marketplace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

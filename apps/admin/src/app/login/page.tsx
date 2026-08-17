'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button, Input, Alert, Spinner } from '@marketplace/ui'
import { loginSchema, type LoginInput } from '../../lib/validation'

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    setFocus('email')
  }, [setFocus])

  async function onSubmit(data: LoginInput) {
    setError(null)
    setIsSubmitting(true)

    try {
      // Make fetch call through Next.js API proxy
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email, password: data.password })
      })

      console.log('Login response status:', response.status)
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Login error response:', errorText)
        throw new Error(`Login failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('Login response:', result)
      console.log('Cookies after login:', document.cookie)
      
      // Backend returns {success: true, data: {user, tokens}}
      if (result.success && result.data) {
        console.log('Login successful, user:', result.data.user)
        // Login successful, redirect to admin dashboard
        // Wait a moment for cookies to be set, then redirect
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed. Please try again.'
      setError(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Admin sign in</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Access the admin dashboard</h1>
        </div>

        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="admin@habesha.com"
              {...register('email')}
              {...(errors.email?.message ? { error: errors.email.message } : {})}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-2 text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              {...(errors.password?.message ? { error: errors.password.message } : {})}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-2 text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" /> Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Use admin credentials only. Default seeded admin account: <br />
          <strong>admin@habesha.com</strong> / <strong>Test1234</strong>
        </div>
      </div>
    </div>
  )
}

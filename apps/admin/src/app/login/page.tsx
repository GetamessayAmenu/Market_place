'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button, Input, Alert, Spinner } from '@marketplace/ui'
import { loginSchema, type LoginInput } from '../../lib/validation'

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // MFA Challenge State
  const [mfaTicket, setMfaTicket] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [isRecoveryCode, setIsRecoveryCode] = useState(false)

  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!mfaTicket) {
      setFocus('email')
    }
  }, [setFocus, mfaTicket])

  async function onLoginSubmit(data: LoginInput) {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email, password: data.password })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Login failed: ${response.status}`)
      }

      // Check if MFA challenge is triggered
      if (result.data?.mfaRequired && result.data?.mfaTicket) {
        setMfaTicket(result.data.mfaTicket)
        setIsSubmitting(false)
        return
      }

      if (result.success && result.data) {
        if (result.data.tokens?.accessToken) {
          localStorage.setItem('admin_access_token', result.data.tokens.accessToken)
        }
        setTimeout(() => {
          window.location.href = '/'
        }, 300)
      } else {
        throw new Error(result.message || 'Invalid response format')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed. Please try again.'
      setError(message)
      setIsSubmitting(false)
    }
  }

  async function onMfaVerifySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mfaCode.trim() || !mfaTicket) return

    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/auth/mfa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mfaTicket,
          mfaCode: mfaCode.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'MFA verification failed. Please check the code.')
      }

      if (result.success && result.data) {
        if (result.data.tokens?.accessToken) {
          localStorage.setItem('admin_access_token', result.data.tokens.accessToken)
        }
        setTimeout(() => {
          window.location.href = '/'
        }, 300)
      } else {
        throw new Error(result.message || 'Invalid verification response')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'MFA verification failed.'
      setError(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg">
        {mfaTicket ? (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">Step 2: Verification</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Two-Factor Authentication</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRecoveryCode
                  ? 'Enter an unused 8-character emergency recovery code.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </p>
            </div>

            {error && (
              <div className="mb-4">
                <Alert variant="error" onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}

            <form onSubmit={onMfaVerifySubmit} className="space-y-5">
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-foreground">
                  {isRecoveryCode ? 'Emergency Recovery Code' : '6-Digit TOTP Code'}
                </label>
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder={isRecoveryCode ? 'e.g. 3A8F9C2D' : '000000'}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  maxLength={isRecoveryCode ? 16 : 8}
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !mfaCode.trim()}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" /> Verifying...
                  </span>
                ) : (
                  'Verify & Continue'
                )}
              </Button>

              <div className="flex flex-col gap-2 pt-2 text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryCode(!isRecoveryCode)
                    setMfaCode('')
                    setError(null)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  {isRecoveryCode ? 'Use authenticator app code instead' : 'Lost authenticator or haven’t set up yet? Use recovery code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaTicket(null)
                    setMfaCode('')
                    setError(null)
                  }}
                  className="hover:underline"
                >
                  Cancel & Back to login
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3.5 text-xs text-left">
                <p className="font-semibold text-primary">First-time Setup / Fast Login:</p>
                <div className="mt-1.5 space-y-1 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Option A:</strong> Use seeded recovery code:{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryCode(true)
                        setMfaCode('RC-9812-7634')
                      }}
                      className="font-mono font-bold text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      RC-9812-7634
                    </button>
                  </p>
                  <p>
                    <strong className="text-foreground">Option B:</strong> Add setup key in Google Authenticator:{' '}
                    <code className="select-all rounded bg-background px-1 py-0.5 font-mono font-bold text-foreground">
                      JBSWY3DPEHPK3PXP
                    </code>
                  </p>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Admin sign in</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">Access the admin dashboard</h1>
            </div>

            {error && (
              <div className="mb-4">
                <Alert variant="error" onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="superadmin@habesha.com"
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
              Privileged marketplace access only. <br />
              <strong>super@habesha.com</strong> / <strong>Test1234</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormInput, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import useAuth from '../../../../hooks/useAuth';
import { changePassword } from '../../../../lib/authClient';
import { changePasswordSchema, type ChangePasswordInput } from '../../../../lib/validation';

export default function SecuritySettingsPage() {
  const user = useAuth((s) => s.user);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return <div className="py-8 text-center text-muted-foreground">Please log in to manage security.</div>;
  }

  async function onSubmit(data: ChangePasswordInput) {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setSuccess(true);
      reset();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to change password.');
    }
    setIsSubmitting(false);
  }

  const onFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
          <p className="text-muted-foreground">Manage your password and account security.</p>
        </div>
        <Link href="/dashboard/settings" className="text-sm font-medium text-primary hover:underline">
          Back to settings
        </Link>
      </div>

      {/* Change Password */}
      <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Change Password</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose a strong password with at least 8 characters, one uppercase letter, and one number.
        </p>

        <form onSubmit={onFormSubmit} className="space-y-4">
          {error && (
            <Alert variant="error" onDismiss={() => { setError(null) }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" onDismiss={() => { setSuccess(false) }}>
              Password changed successfully.
            </Alert>
          )}

          <FormInput
            label="Current Password"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
            {...(errors.currentPassword?.message !== undefined && { error: errors.currentPassword.message })}
          />

          <FormInput
            label="New Password"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            {...(errors.newPassword?.message !== undefined && { error: errors.newPassword.message })}
          />

          <FormInput
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            {...register('confirmNewPassword')}
            {...(errors.confirmNewPassword?.message !== undefined && { error: errors.confirmNewPassword.message })}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Updating...
                </span>
              ) : (
                'Change password'
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Progressive Verification */}
      <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Verification Status</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Verify your account to build trust with buyers and sellers. Phone verification is recommended but not required.
        </p>

        <div className="space-y-3">
          {/* Email Verification */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${user.emailVerified ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                {user.emailVerified ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">Email Verified</p>
                <p className="text-xs text-muted-foreground">Required for account recovery</p>
              </div>
            </div>
            <span className={`text-xs font-medium ${user.emailVerified ? 'text-green-600' : 'text-muted-foreground'}`}>
              {user.emailVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>

          {/* Phone Verification */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${user.phoneVerified ? 'bg-green-100 text-green-600' : 'bg-brand-gold/10 text-brand-gold'}`}>
                {user.phoneVerified ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">Phone Verified</p>
                <p className="text-xs text-muted-foreground">Recommended for trust signals</p>
              </div>
            </div>
            <span className={`text-xs font-medium ${user.phoneVerified ? 'text-green-600' : 'text-brand-gold'}`}>
              {user.phoneVerified ? 'Verified' : 'Recommended'}
            </span>
          </div>
        </div>

        {!user.phoneVerified && (
          <div className="mt-4 p-3 bg-brand-gold/5 border border-brand-gold/20 rounded-lg">
            <p className="text-xs text-brand-gold">
              <strong>Tip:</strong> Phone verified sellers get more inquiries and appear more trustworthy to buyers.
            </p>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Account Information</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Account ID</dt>
            <dd className="font-mono text-xs">{user.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium capitalize">{user.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email Verified</dt>
            <dd className="font-medium">{user.emailVerified ? 'Yes' : 'No'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Phone Verified</dt>
            <dd className="font-medium">{user.phoneVerified ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

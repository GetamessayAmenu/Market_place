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
        </dl>
      </div>
    </div>
  );
}

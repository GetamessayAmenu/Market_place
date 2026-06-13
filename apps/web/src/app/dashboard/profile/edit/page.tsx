"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, FormInput, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import useAuth from '../../../../hooks/useAuth';
import { updateProfile } from '../../../../lib/authClient';
import { profileUpdateSchema, type ProfileUpdateInput } from '../../../../lib/validation';

export default function EditProfilePage() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName,
        phone: undefined,
      });
    }
  }, [user, reset]);

  if (!user) {
    return <div className="py-8 text-center text-muted-foreground">Please log in to edit your profile.</div>;
  }

  async function onSubmit(data: ProfileUpdateInput) {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      const payload: { displayName?: string; phone?: string } = {
        displayName: data.displayName,
      };
      if (data.phone) {
        payload.phone = data.phone;
      }
      const updatedUser = await updateProfile(payload);
      setUser(updatedUser);
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to update profile. Please try again.');
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
          <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground">Update your display name and contact information.</p>
        </div>
        <Link href="/dashboard/profile" className="text-sm font-medium text-primary hover:underline">
          Back to profile
        </Link>
      </div>

      <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm">
        <form onSubmit={onFormSubmit} className="space-y-4">
          {error && (
            <Alert variant="error" onDismiss={() => { setError(null) }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" onDismiss={() => { setSuccess(false) }}>
              Profile updated successfully.
            </Alert>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <FormInput
            label="Display Name"
            {...register('displayName')}
            {...(errors.displayName?.message !== undefined && { error: errors.displayName.message })}
          />

          <FormInput
            label="Phone"
            type="tel"
            placeholder="+1234567890"
            {...register('phone')}
            {...(errors.phone?.message !== undefined && { error: errors.phone.message })}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Saving...
                </span>
              ) : (
                'Save changes'
              )}
            </Button>
            <Link href="/dashboard/profile">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

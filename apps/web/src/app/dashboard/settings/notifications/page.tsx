"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { notificationPreferencesSchema, type NotificationPreferencesInput } from '../../../../lib/validation';

const notificationOptions: { key: keyof NotificationPreferencesInput; label: string; description: string }[] = [
  { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email for important updates.' },
  { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications in real time.' },
  { key: 'chatNotifications', label: 'Chat Notifications', description: 'Get notified when you receive new messages.' },
  { key: 'listingAlerts', label: 'Listing Alerts', description: 'Get alerts when new listings match your interests.' },
  { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional offers and newsletters.' },
];

export default function NotificationSettingsPage() {
  const { register, handleSubmit } = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      chatNotifications: true,
      listingAlerts: true,
      marketingEmails: false,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(_data: NotificationPreferencesInput) {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      // TODO: Call notification preferences API when available
      await new Promise((resolve) => { setTimeout(resolve, 500); });
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to save notification preferences.');
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
          <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
          <p className="text-muted-foreground">Choose what notifications you receive and how.</p>
        </div>
        <Link href="/dashboard/settings" className="text-sm font-medium text-primary hover:underline">
          Back to settings
        </Link>
      </div>

      <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm">
        <form onSubmit={onFormSubmit} className="space-y-6">
          {error && (
            <Alert variant="error" onDismiss={() => { setError(null) }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" onDismiss={() => { setSuccess(false) }}>
              Notification preferences saved.
            </Alert>
          )}

          <div className="space-y-4">
            {notificationOptions.map((option) => (
              <div key={option.key} className="flex items-start justify-between gap-4 rounded-md border p-4">
                <div>
                  <label htmlFor={option.key} className="text-sm font-medium cursor-pointer">
                    {option.label}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </div>
                <input
                  type="checkbox"
                  id={option.key}
                  className="mt-1 h-4 w-4 rounded border-input accent-primary cursor-pointer"
                  {...register(option.key)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Saving...
                </span>
              ) : (
                'Save preferences'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

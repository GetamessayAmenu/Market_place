"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Spinner } from '@marketplace/ui';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { apiGet, apiPatch } from '../../../../lib/api';
import { notificationPreferencesSchema, type NotificationPreferencesInput } from '../../../../lib/validation';

const notificationOptions: { key: keyof NotificationPreferencesInput; label: string; description: string }[] = [
  { key: 'chat', label: 'Chat Notifications', description: 'Get notified when you receive new direct messages.' },
  { key: 'listing', label: 'Listing Notifications', description: 'Updates on listing approvals, rejections, or edits.' },
  { key: 'order', label: 'Order Notifications', description: 'Alerts when orders are created, updated, or cancelled.' },
  { key: 'rental', label: 'Rental Notifications', description: 'Notifications for rental requests and status changes.' },
  { key: 'customOrder', label: 'Custom Order Notifications', description: 'Updates regarding custom tailoring requests and quotes.' },
  { key: 'promotional', label: 'Announcements & Promotions', description: 'Platform announcements and promotional updates.' },
];

export default function NotificationSettingsPage() {
  const { register, handleSubmit, reset } = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      chat: true,
      listing: true,
      order: true,
      rental: true,
      customOrder: true,
      promotional: true,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const prefs = await apiGet<NotificationPreferencesInput>('/notifications/preferences');
        if (prefs) {
          reset({
            chat: prefs.chat ?? true,
            listing: prefs.listing ?? true,
            order: prefs.order ?? true,
            rental: prefs.rental ?? true,
            customOrder: prefs.customOrder ?? true,
            promotional: prefs.promotional ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadPreferences();
  }, [reset]);

  async function onSubmit(data: NotificationPreferencesInput) {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await apiPatch('/notifications/preferences', data as Record<string, unknown>);
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
          <p className="text-muted-foreground">Control optional alerts and notifications.</p>
        </div>
        <Link href="/dashboard/settings" className="text-sm font-medium text-primary hover:underline">
          Back to settings
        </Link>
      </div>

      <div className="max-w-lg rounded-lg border bg-card p-6 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <form onSubmit={onFormSubmit} className="space-y-6">
            {error && (
              <Alert variant="error" onDismiss={() => { setError(null) }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" onDismiss={() => { setSuccess(false) }}>
                Notification preferences saved successfully.
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
        )}
      </div>
    </div>
  );
}

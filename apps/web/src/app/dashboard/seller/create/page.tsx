"use client"
import { Alert } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import ListingForm, { type ListingFormData } from '../../../../components/seller/ListingForm';
import { useCreateListing } from '../../../../hooks/useSeller';

export default function CreateListingPage() {
  const router = useRouter();
  const createMutation = useCreateListing();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: ListingFormData) {
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        price: Number(data.price),
        categoryId: data.categoryId,
        city: data.city,
        condition: data.condition,
        images: data.images.map((img, idx) => ({
          url: img.url,
          cloudinaryPublicId: img.cloudinaryPublicId,
          sortOrder: idx,
          isPrimary: idx === 0,
        })),
        contactOptions: {
          showPhone: data.contactOptions.showPhone,
          inAppMessaging: data.contactOptions.inAppMessaging,
          ...(data.contactOptions.whatsapp ? { whatsapp: data.contactOptions.whatsapp } : {}),
          ...(data.contactOptions.telegram ? { telegram: data.contactOptions.telegram } : {}),
        },
      };

      await createMutation.mutateAsync(payload);
      router.push('/dashboard/seller/listings');
      return;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to create listing. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Listing</h1>
        <p className="text-muted-foreground">Fill in the details to create a new listing.</p>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => { setError(null); }}>
          {error}
        </Alert>
      )}

      <ListingForm
        onSubmit={(data) => { void handleSubmit(data); }}
        isSubmitting={createMutation.isPending}
        submitLabel="Create Listing"
      />
    </div>
  );
}

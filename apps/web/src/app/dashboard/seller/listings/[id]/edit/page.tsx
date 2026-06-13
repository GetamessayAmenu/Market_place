"use client"
import { Alert, Skeleton } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import ListingForm, { type ListingFormData } from '../../../../../../components/seller/ListingForm';
import useAuth from '../../../../../../hooks/useAuth';
import { useMyListing, useUpdateListing } from '../../../../../../hooks/useSeller';

interface PageProps {
  params: { id: string };
}

export default function EditListingPage({ params }: PageProps) {
  const { id } = params;
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const { data: listing, isLoading, isError } = useMyListing(id);
  const updateMutation = useUpdateListing();
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <div className="py-8 text-center text-muted-foreground">Please log in.</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">Failed to load listing.</p>
      </div>
    );
  }

  const initialData: Partial<ListingFormData> = {
    title: listing.title,
    description: listing.description,
    price: String(listing.price),
    categoryId: listing.category?.id ?? '',
    city: listing.city ?? '',
    condition: listing.condition,
    contactOptions: {
      showPhone: listing.contactOptions?.showPhone ?? false,
      whatsapp: listing.contactOptions?.whatsapp ?? '',
      telegram: listing.contactOptions?.telegram ?? '',
      inAppMessaging: listing.contactOptions?.inAppMessaging ?? true,
    },
    images: listing.images.map((img) => ({
      url: img.url,
      cloudinaryPublicId: img.cloudinaryPublicId,
      sortOrder: img.sortOrder,
    })),
  };

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

      await updateMutation.mutateAsync({ id, data: payload });
      router.push('/dashboard/seller/listings/' + id);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to update listing. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Listing</h1>
        <p className="text-muted-foreground">Update the details of your listing.</p>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => { setError(null); }}>
          {error}
        </Alert>
      )}

      <ListingForm
        initialData={initialData}
        onSubmit={(data) => { void handleSubmit(data); }}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  );
}

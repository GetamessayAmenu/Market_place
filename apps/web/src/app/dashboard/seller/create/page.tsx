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
        price: Number(data.pricing.price),
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

      // Type-specific availability flags
      payload.availableForPurchase = data.delivery.availableForPurchase;
      payload.availableForRent = data.delivery.availableForRent;
      payload.customOrderAvailable = data.delivery.customOrderAvailable;

      // Rent-specific fields
      if (data.listingType === 'rent' && data.delivery.availableForRent) {
        if (data.pricing.rentalPricePerDay) {
          payload.rentalPricePerDay = Number(data.pricing.rentalPricePerDay);
        }
        if (data.pricing.rentalDeposit) {
          payload.rentalDeposit = Number(data.pricing.rentalDeposit);
        }
      }

      // Build attributes object (tags, delivery info, pricing extras)
      const attributes: Record<string, unknown> = {};

      if (data.tags.length > 0) {
        attributes.tags = data.tags;
      }

      // Delivery info
      attributes.deliveryMethod = data.delivery.deliveryMethod;
      if (data.delivery.deliveryFee) {
        attributes.deliveryFee = Number(data.delivery.deliveryFee);
      }
      attributes.processingDays = Number(data.delivery.processingDays);

      // Sale-specific extras
      if (data.listingType === 'sale') {
        if (data.pricing.compareAtPrice) {
          attributes.compareAtPrice = Number(data.pricing.compareAtPrice);
        }
        if (data.pricing.sku) {
          attributes.sku = data.pricing.sku;
        }
      }

      // Rent-specific extras
      if (data.listingType === 'rent' && data.pricing.minimumRentalDays) {
        attributes.minimumRentalDays = Number(data.pricing.minimumRentalDays);
      }

      // Custom-specific extras
      if (data.listingType === 'custom') {
        if (data.pricing.estimatedDays) {
          attributes.estimatedDays = Number(data.pricing.estimatedDays);
        }
        if (data.pricing.customizationNotes) {
          attributes.customizationNotes = data.pricing.customizationNotes;
        }
      }

      payload.attributes = attributes;

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
        <h1 className="text-2xl font-display font-bold tracking-tight">Create Listing</h1>
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
        submitLabel="Publish Listing"
      />
    </div>
  );
}

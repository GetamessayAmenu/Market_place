"use client"
import { Alert, Skeleton } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { DEFAULT_DELIVERY, type DeliveryData } from '../../../../../../components/seller/DeliveryOptions';
import ListingForm, { type ListingFormData } from '../../../../../../components/seller/ListingForm';
import type { ListingType } from '../../../../../../components/seller/ListingTypeSelector';
import { DEFAULT_PRICING, type PricingData } from '../../../../../../components/seller/PricingSection';
import useAuth from '../../../../../../hooks/useAuth';
import { useMyListing, useUpdateListing } from '../../../../../../hooks/useSeller';

interface PageProps {
  params: { id: string };
}

function inferListingType(listing: { availableForRent?: boolean | null; customOrderAvailable?: boolean | null }): ListingType {
  if (listing.customOrderAvailable === true) return 'custom';
  if (listing.availableForRent === true) return 'rent';
  return 'sale';
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

  // Infer listing type from existing flags
  const listingType = inferListingType(listing);

  // Extract attributes with typed helpers
  const rawAttrs = listing.attributes ?? {};
  function strAttr(key: string): string {
    const v = rawAttrs[key];
    return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';
  }
  function numAttr(key: string): number | undefined {
    const v = rawAttrs[key];
    return typeof v === 'number' ? v : undefined;
  }

  const initialPricing: PricingData = {
    ...DEFAULT_PRICING,
    price: String(listing.price),
    compareAtPrice: strAttr('compareAtPrice'),
    sku: strAttr('sku'),
    rentalPricePerDay: listing.rentalPricePerDay ? String(listing.rentalPricePerDay) : '',
    rentalDeposit: listing.rentalDeposit ? String(listing.rentalDeposit) : '',
    minimumRentalDays: numAttr('minimumRentalDays') ? String(numAttr('minimumRentalDays')) : '1',
    estimatedDays: numAttr('estimatedDays') ? String(numAttr('estimatedDays')) : '14',
    customizationNotes: strAttr('customizationNotes'),
  };

  const deliveryMethod = strAttr('deliveryMethod');
  const validMethod: DeliveryData['deliveryMethod'] = deliveryMethod === 'delivery' || deliveryMethod === 'both' ? deliveryMethod : 'pickup';
  const initialDelivery: DeliveryData = {
    ...DEFAULT_DELIVERY,
    deliveryMethod: validMethod,
    deliveryFee: numAttr('deliveryFee') ? String(numAttr('deliveryFee')) : '',
    processingDays: numAttr('processingDays') ? String(numAttr('processingDays')) : '3',
    availableForPurchase: listing.availableForPurchase ?? true,
    availableForRent: listing.availableForRent ?? false,
    customOrderAvailable: listing.customOrderAvailable ?? false,
  };

  const initialData: Partial<ListingFormData> = {
    listingType,
    title: listing.title,
    description: listing.description,
    price: String(listing.price),
    categoryId: listing.category?.id ?? '',
    categoryName: listing.category?.name ?? '',
    city: listing.city ?? '',
    condition: listing.condition,
    tags: Array.isArray(rawAttrs.tags) ? rawAttrs.tags as string[] : [],
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
    pricing: initialPricing,
    delivery: initialDelivery,
  };

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

      // Build attributes
      const attributes: Record<string, unknown> = {};
      if (data.tags.length > 0) attributes.tags = data.tags;
      attributes.deliveryMethod = data.delivery.deliveryMethod;
      if (data.delivery.deliveryFee) attributes.deliveryFee = Number(data.delivery.deliveryFee);
      attributes.processingDays = Number(data.delivery.processingDays);

      if (data.listingType === 'sale') {
        if (data.pricing.compareAtPrice) attributes.compareAtPrice = Number(data.pricing.compareAtPrice);
        if (data.pricing.sku) attributes.sku = data.pricing.sku;
      }
      if (data.listingType === 'rent' && data.pricing.minimumRentalDays) {
        attributes.minimumRentalDays = Number(data.pricing.minimumRentalDays);
      }
      if (data.listingType === 'custom') {
        if (data.pricing.estimatedDays) attributes.estimatedDays = Number(data.pricing.estimatedDays);
        if (data.pricing.customizationNotes) attributes.customizationNotes = data.pricing.customizationNotes;
      }

      payload.attributes = attributes;

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
        <h1 className="text-2xl font-display font-bold tracking-tight">Edit Listing</h1>
        <p className="text-muted-foreground">Update the details of your listing.</p>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => { setError(null); }}>
          {error}
        </Alert>
      )}

      <ListingForm
        initialData={initialData}
        initialListingType={listingType}
        onSubmit={(data) => { void handleSubmit(data); }}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save Changes"
      />
    </div>
  );
}

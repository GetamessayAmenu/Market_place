'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardContent, Spinner, Alert } from '@marketplace/ui';
import ListingForm from '../../../../../components/seller/ListingForm';
import type { ListingFormData } from '../../../../../components/seller/ListingForm';
import useAuth from '../../../../../hooks/useAuth';
import { apiGet, apiPatch } from '../../../../../lib/api';

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const user = useAuth((s) => s.user);

  const [initialData, setInitialData] = useState<ListingFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);
  const [_listingStatus, setListingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    async function fetchListing() {
      try {
        setLoading(true);
        setError(null);
        const listing = await apiGet<any>(`/listings/${id}`);

        if (!listing) {
          setError('Listing not found');
          return;
        }

        setRejectedReason(listing.rejectedReason ?? null);
        setListingStatus(listing.status ?? listing.moderationStatus ?? null);

        // Map backend listing object to ListingFormData expected by ListingForm
        const formData: ListingFormData = {
          listingType: listing.availableForRent ? 'rent' : 'sale',
          title: listing.title ?? '',
          description: listing.description ?? '',
          price: String(listing.price ?? ''),
          categoryId: listing.categoryId ?? listing.category?.id ?? '',
          categoryName: listing.category?.name ?? '',
          city: listing.city ?? '',
          condition: listing.condition ?? '',
          contactOptions: listing.contactOptions ?? {
            showPhone: false,
            whatsapp: '',
            telegram: '',
            inAppMessaging: true,
          },
          images: Array.isArray(listing.images)
            ? listing.images.map((img: any, idx: number) => ({
                url: img.url,
                cloudinaryPublicId: img.cloudinaryPublicId ?? img.id ?? `img-${idx}`,
                sortOrder: img.sortOrder ?? idx,
              }))
            : [],
          productDetails: listing.attributes
            ? {
                size: listing.attributes.size ?? '',
                color: listing.attributes.color ?? '',
                material: listing.attributes.material ?? '',
                gender: listing.attributes.gender ?? '',
                style: listing.attributes.style ?? '',
              }
            : null,
          rentalInfo: listing.availableForRent
            ? {
                rentalPricePerDay: String(listing.rentalPricePerDay ?? ''),
                rentalDeposit: String(listing.rentalDeposit ?? ''),
                minRentalDays: '1',
                maxRentalDays: '30',
              }
            : null,
          customOrderAvailable: Boolean(listing.customOrderAvailable),
          customDetails: listing.customOrderAvailable
            ? {
                sizeAdjustments: Boolean(listing.attributes?.sizeAdjustments),
                colorFabricChanges: Boolean(listing.attributes?.colorFabricChanges),
                embroidery: Boolean(listing.attributes?.embroidery),
                otherCustomization: listing.attributes?.otherCustomization ?? '',
                additionalCustomPrice: String(listing.startingCustomPrice ?? ''),
              }
            : null,
        };

        setInitialData(formData);
      } catch (err: any) {
        console.error('Error fetching listing for edit:', err);
        setError('Failed to load listing details. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    void fetchListing();
  }, [id, user]);

  const handleSubmit = async (data: ListingFormData) => {
    if (!user || !id) {
      setError('You must be logged in to update a listing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Transform form data to match API DTO
      const apiData: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price) || 0,
        categoryId: data.categoryId,
        condition: data.condition,
        city: data.city,
        contactOptions: data.contactOptions,
        availableForPurchase: data.listingType === 'sale',
        availableForRent: data.listingType === 'rent',
        customOrderAvailable: data.customOrderAvailable,
        images: data.images.map((img) => ({
          url: img.url,
          cloudinaryPublicId: img.cloudinaryPublicId,
          sortOrder: img.sortOrder,
          isPrimary: img.sortOrder === 0,
        })),
      };

      // Add rental pricing if applicable
      if (data.listingType === 'rent' && data.rentalInfo) {
        apiData.rentalPricePerDay = parseFloat(data.rentalInfo.rentalPricePerDay) || 0;
        apiData.rentalDeposit = parseFloat(data.rentalInfo.rentalDeposit) || 0;
      }

      // Add custom order details if applicable
      if (data.customOrderAvailable && data.customDetails) {
        if (data.customDetails.additionalCustomPrice) {
          apiData.startingCustomPrice = parseFloat(data.customDetails.additionalCustomPrice) || 0;
        }
        apiData.attributes = {
          sizeAdjustments: data.customDetails.sizeAdjustments,
          colorFabricChanges: data.customDetails.colorFabricChanges,
          embroidery: data.customDetails.embroidery,
          otherCustomization: data.customDetails.otherCustomization,
        };
      }

      // Merge product details into attributes
      if (data.productDetails) {
        const existingAttributes = (apiData.attributes as Record<string, unknown>) || {};
        apiData.attributes = {
          ...existingAttributes,
          ...data.productDetails,
        };
      }

      await apiPatch(`/listings/${id}`, apiData);
      setSuccess(true);
    } catch (err: any) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update listing. Please try again.';
      setError(errorMessage);
      console.error('Listing update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Please log in to edit your listing
            </p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
        <Button onClick={() => router.push('/seller/catalog')}>
          Return to My Catalog
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
          <CardContent className="p-8 text-center">
            <div className="mb-4 text-green-600 dark:text-green-400">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
              Listing Updated Successfully!
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-6">
              Your changes have been saved. Low-risk edits apply live immediately, while high-risk changes or resubmissions have been queued for admin re-approval.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push('/seller/catalog')}>
                Go to My Catalog
              </Button>
              <Button variant="outline" onClick={() => router.push(`/products/${id}`)}>
                View Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Edit Listing
          </h1>
          <p className="text-muted-foreground">
            Update your item details or resubmit after fixing feedback
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/seller/catalog')}>
          Cancel & Back
        </Button>
      </div>

      {rejectedReason && (
        <Alert variant="warning" className="mb-6">
          <p className="font-semibold text-sm">Moderator Feedback / Reason:</p>
          <p className="mt-1 text-sm">{rejectedReason}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Fixing issues and clicking "Save & Resubmit Changes" will resubmit your listing for admin review.
          </p>
        </Alert>
      )}

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {initialData && (
        <Card>
          <CardContent className="p-6">
            <ListingForm
              key={id}
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Save & Resubmit Changes"
              error={error}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

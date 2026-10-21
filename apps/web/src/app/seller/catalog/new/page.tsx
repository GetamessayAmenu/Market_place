'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@marketplace/ui';
import ListingForm, { type ListingFormData } from '../../../../components/seller/ListingForm';
import useAuth from '../../../../hooks/useAuth';
import { apiPost, getApiErrorMessage } from '../../../../lib/api';

export default function NewListingPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check seller privileges
  const isSellerOrAdmin =
    user?.role === 'seller' ||
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    (Array.isArray(user?.roles) &&
      (user?.roles.includes('seller') ||
        user?.roles.includes('admin') ||
        user?.roles.includes('super_admin')));

  const handleSubmit = async (data: ListingFormData) => {
    if (!user) {
      setError('You must be signed in to create a listing. Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Build API payload aligned with backend CreateListingDto
      const isRent = Boolean(data.availableForRent);
      const isSale = Boolean(data.availableForPurchase);

      // Ensure all images are permanently persisted to the server without losing user photos
      const resolvedImages = await Promise.all(
        data.images.map(async (img, idx) => {
          let finalUrl = img.url;
          let publicId = img.cloudinaryPublicId;

          if (finalUrl.startsWith('blob:')) {
            try {
              const blobRes = await fetch(finalUrl);
              const blob = await blobRes.blob();
              const uploadForm = new FormData();
              uploadForm.append('file', blob, `photo_${idx}.jpg`);

              const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadForm,
              });

              if (uploadRes.ok) {
                const uploadJson = await uploadRes.json();
                finalUrl = uploadJson.url;
                publicId = uploadJson.cloudinaryPublicId;
              }
            } catch (blobErr) {
              console.error('Failed to upload blob photo to server:', blobErr);
            }
          }

          return {
            url: finalUrl,
            cloudinaryPublicId:
              publicId && publicId.includes('listings')
                ? publicId
                : `marketplace/listings/item_${idx}_${Date.now()}`,
            sortOrder: img.sortOrder ?? idx,
            isPrimary: idx === 0,
          };
        }),
      );

      const apiData: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        price: isSale ? (parseFloat(data.price) || 0) : (parseFloat(data.rentalPricePerDay || data.price) || 0),
        categoryId: data.categoryId,
        condition: data.condition,
        city: data.city,
        contactOptions: data.contactOptions,
        availableForPurchase: isSale,
        availableForRent: isRent,
        customOrderAvailable: data.customOrderAvailable,
        supportsReadyMade: true,
        images: resolvedImages,
      };

      // Add rental parameters
      if (isRent) {
        apiData.rentalPricePerDay = parseFloat(data.rentalPricePerDay || data.rentalInfo?.rentalPricePerDay || '0') || 0;
        apiData.rentalDeposit = parseFloat(data.rentalDeposit || data.rentalInfo?.rentalDeposit || '0') || 0;
        const threeDayVal = data.rentalThreeDayRate || data.rentalInfo?.rentalThreeDayRate;
        if (threeDayVal) {
          apiData.rentalThreeDayRate = parseFloat(threeDayVal) || undefined;
        }
        const weeklyVal = data.rentalWeeklyRate || data.rentalInfo?.rentalWeeklyRate;
        if (weeklyVal) {
          apiData.rentalWeeklyRate = parseFloat(weeklyVal) || undefined;
        }
        apiData.minRentalDurationDays = parseInt(data.minRentalDurationDays || data.rentalInfo?.minRentalDays || '1', 10) || 1;
        if (data.maxRentalDurationDays) {
          apiData.maxRentalDurationDays = parseInt(data.maxRentalDurationDays, 10);
        }
        if (data.rentalPickupLocation) {
          apiData.rentalPickupLocation = data.rentalPickupLocation;
        }
        if (data.rentalNotes) {
          apiData.rentalNotes = data.rentalNotes;
        }
      }

      // Add custom-order parameters
      if (data.customOrderAvailable) {
        apiData.supportsCustomDesign = true;
        apiData.estimatedProductionDays = data.customDetails?.productionDays
          ? parseInt(data.customDetails.productionDays, 10)
          : 7;
        if (data.customDetails?.additionalCustomPrice) {
          apiData.startingCustomPrice = parseFloat(data.customDetails.additionalCustomPrice) || 0;
        }
        if (data.customDetails) {
          apiData.customizationOptions = {
            sizeAdjustments: Boolean(data.customDetails.sizeAdjustments),
            colorFabricChanges: Boolean(data.customDetails.colorFabricChanges),
            embroidery: Boolean(data.customDetails.embroidery),
            otherCustomization: data.customDetails.otherCustomization || '',
          };
        }
      } else {
        apiData.supportsCustomDesign = false;
      }

      // Store product & rental details in attributes
      apiData.attributes = {
        ...(data.productDetails || {}),
        ...(isRent ? {
          minRentalDays: data.minRentalDurationDays || '1',
          maxRentalDays: data.maxRentalDurationDays || '30',
        } : {}),
      };

      await apiPost<{ id: string }>('/listings', apiData);

      // Clear draft on successful submission
      if (typeof window !== 'undefined' && user?.id) {
        try {
          localStorage.removeItem(`habesha_draft_${user.id}`);
        } catch (_e) {
          // ignore
        }
      }

      setSuccess(true);
    } catch (err: unknown) {
      const friendlyMessage = getApiErrorMessage(
        err,
        'Failed to submit listing. Please check your entered details and try again.',
      );
      setError(friendlyMessage);
      console.error('Listing creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // State 1: Not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full text-center p-6 border-dashed">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Sign In to Create a Listing</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Please sign in with your seller account to list your Ethiopian fashion items for sale or rent.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button onClick={() => router.push('/login?redirect=/seller/catalog/new')}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => router.push('/register?role=seller')}>
              Create Seller Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // State 2: Logged in, but account is a buyer (not yet registered or configured as seller)
  if (!isSellerOrAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-lg w-full p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">Seller Account Required</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              You are signed in as <span className="font-semibold text-foreground">{user.displayName || user.email}</span> with a buyer profile. To publish listings and sell Ethiopian clothing, please complete your free seller registration.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/setup/seller-type')}>
                Complete Seller Setup
              </Button>
              <Button variant="outline" onClick={() => router.push('/login')}>
                Switch Account
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
              Need help? Contact our seller onboarding team at support@habeshamarket.com.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // State 3: Successfully submitted
  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-100">
                Listing Submitted for Review! 🎉
              </h2>
              <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                Your listing has been submitted and is now pending admin review. Once approved, it will go live for Ethiopian fashion buyers across the platform.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => router.push('/seller/catalog')}>
                View in My Catalog
              </Button>
              <Button variant="outline" onClick={() => { setSuccess(false); setError(null); }}>
                Add Another Item
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State 4: Standard listing creation flow
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            Create Product Listing
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            List your Ethiopian fashion pieces for sale or rent in minutes.
          </p>
        </div>

        <Link
          href="/seller/catalog"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
        >
          ← Back to Catalog
        </Link>
      </div>

      {/* Listing Form */}
      <ListingForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Submit for Review"
        error={error}
        onClearError={() => setError(null)}
      />
    </div>
  );
}
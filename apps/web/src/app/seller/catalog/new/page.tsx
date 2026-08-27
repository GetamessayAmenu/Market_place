'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@marketplace/ui';
import ListingForm from '../../../../components/seller/ListingForm';
import type { ListingFormData } from '../../../../components/seller/ListingForm';
import useAuth from '../../../../hooks/useAuth';
import { apiPost } from '../../../../lib/api';

export default function NewListingPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: ListingFormData) => {
    if (!user) {
      setError('You must be logged in to create a listing');
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
        images: data.images.map(img => ({
          url: img.url,
          cloudinaryPublicId: img.cloudinaryPublicId,
          sortOrder: img.sortOrder,
          isPrimary: img.sortOrder === 0
        })),
      };

      // Add rental pricing if available
      if (data.listingType === 'rent' && data.rentalInfo) {
        apiData.rentalPricePerDay = parseFloat(data.rentalInfo.rentalPricePerDay) || 0;
        apiData.rentalDeposit = parseFloat(data.rentalInfo.rentalDeposit) || 0;
      }

      // Add custom order details if available
      if (data.customOrderAvailable && data.customDetails) {
        if (data.customDetails.additionalCustomPrice) {
          apiData.startingCustomPrice = parseFloat(data.customDetails.additionalCustomPrice) || 0;
        }
        // Store custom details as attributes
        apiData.attributes = {
          sizeAdjustments: data.customDetails.sizeAdjustments,
          colorFabricChanges: data.customDetails.colorFabricChanges,
          embroidery: data.customDetails.embroidery,
          otherCustomization: data.customDetails.otherCustomization,
        };
      }

      // Add product details as attributes
      if (data.productDetails) {
        const existingAttributes = (apiData.attributes as Record<string, unknown>) || {};
        apiData.attributes = {
          ...existingAttributes,
          ...data.productDetails,
        };
      }

      await apiPost<{ id: string }>('/listings', apiData);

      // Show success message
      setSuccess(true);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create listing. Please try again.';
      setError(errorMessage);
      console.error('Listing creation error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      console.error('Server response:', err.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Please log in to create a listing</p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
          <CardContent className="p-8 text-center">
            <div className="mb-4 text-green-600 dark:text-green-400">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">Listing Submitted Successfully!</h2>
            <p className="text-green-700 dark:text-green-300 mb-6">
              Your listing has been submitted and is now pending approval by our admin team. 
              You will be notified once it has been reviewed and approved.
            </p>
            <Button onClick={() => router.push('/seller/catalog')}>
              Go to My Catalog
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight">Create New Listing</h1>
        <p className="text-muted-foreground">Add a new product to your catalog</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <ListingForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Publish Listing"
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
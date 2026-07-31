'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@marketplace/ui';
import ListingForm from '../../../../components/seller/ListingForm';
import type { ListingFormData } from '../../../../components/seller/ListingForm';
import useAuth from '../../../../hooks/useAuth';

export default function NewListingPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ListingFormData) => {
    if (!user) {
      setError('You must be logged in to create a listing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Integrate with actual API
      console.log('Creating listing:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to catalog page on success
      router.push('/seller/catalog');
    } catch (err) {
      setError('Failed to create listing. Please try again.');
      console.error('Listing creation error:', err);
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
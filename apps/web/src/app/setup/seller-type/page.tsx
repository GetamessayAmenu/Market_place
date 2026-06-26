"use client"
import { Button, Spinner } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import AuthLayout from '../../../components/layouts/AuthLayout';
import SellerTypeSelector, { type SellerType } from '../../../components/auth/SellerTypeSelector';

export default function SellerTypeSetupPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<SellerType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      // TODO: Save seller type to user profile via API
      // await updateUserProfile({ sellerType: selectedType });
      
      // Redirect to shop setup
      router.push('/setup/shop');
    } catch (error) {
      console.error('Failed to save seller type:', error);
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/setup/shop');
  };

  return (
    <AuthLayout 
      title="Complete Your Seller Profile" 
      subtitle="Tell us about your business to personalize your experience"
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Step 1 of 3</span>
          <span className="text-brand-gold font-medium">Seller Type</span>
        </div>

        {/* Seller Type Selector */}
        <SellerTypeSelector 
          onSelect={setSelectedType}
          selectedType={selectedType}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleContinue}
            disabled={!selectedType || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" /> Saving...
              </span>
            ) : (
              'Continue'
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1"
          >
            Skip for now
          </Button>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground">
          You can change your seller type later in your profile settings
        </p>
      </div>
    </AuthLayout>
  );
}

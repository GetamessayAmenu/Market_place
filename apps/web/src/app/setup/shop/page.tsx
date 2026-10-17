"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormInput, Spinner } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import AuthLayout from '../../../components/layouts/AuthLayout';
import {
  aboutShopSchema,
  addressSchema,
  bannerSchema,
  businessHoursSchema,
  deliveryAreaSchema,
  logoSchema,
  shopNameSchema,
  shopSetupSchema,
  socialLinksSchema,
  type ShopSetupInput,
} from '../../../lib/shopSetupValidation';

type Step = 'name' | 'logo' | 'banner' | 'about' | 'address' | 'delivery' | 'social' | 'hours' | 'complete';

const steps: { key: Step; title: string; description: string; optional: boolean }[] = [
  { key: 'name', title: 'Shop Name', description: 'Give your shop a memorable name', optional: false },
  { key: 'logo', title: 'Logo', description: 'Add your shop logo', optional: true },
  { key: 'banner', title: 'Banner', description: 'Add a cover image', optional: true },
  { key: 'about', title: 'About Shop', description: 'Tell customers about your business', optional: false },
  { key: 'address', title: 'Address', description: 'Where is your shop located?', optional: false },
  { key: 'delivery', title: 'Delivery Areas', description: 'Set up delivery zones', optional: true },
  { key: 'social', title: 'Social Links', description: 'Connect your social media', optional: true },
  { key: 'hours', title: 'Business Hours', description: 'When are you open?', optional: true },
];

const ethiopianCities = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Bahir Dar', 'Adama', 'Hawassa', 'Jimma', 'Dessie', 'Shashamene'
];

const defaultHours = [
  { day: 'monday' as const, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'tuesday' as const, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'wednesday' as const, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'thursday' as const, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'friday' as const, isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'saturday' as const, isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'sunday' as const, isOpen: false, openTime: '', closeTime: '' },
];

export default function ShopSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<ShopSetupInput>({
    resolver: zodResolver(shopSetupSchema),
    defaultValues: {
      deliveryAreas: [{ area: '', fee: 0, estimatedTime: '' }],
      hours: defaultHours,
    },
  });

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const getCurrentSchema = () => {
    switch (currentStep) {
      case 'name':
        return shopNameSchema;
      case 'logo':
        return logoSchema;
      case 'banner':
        return bannerSchema;
      case 'about':
        return aboutShopSchema;
      case 'address':
        return addressSchema;
      case 'delivery':
        return deliveryAreaSchema;
      case 'social':
        return socialLinksSchema;
      case 'hours':
        return businessHoursSchema;
      default:
        return shopNameSchema;
    }
  };

  const handleNext = useCallback(async () => {
    const schema = getCurrentSchema();
    const currentData = {
      shopName: watch('shopName') || '',
      logoUrl: watch('logoUrl') || '',
      bannerUrl: watch('bannerUrl') || '',
      description: watch('description') || '',
      story: watch('story') || '',
      address: watch('address') || '',
      city: watch('city') || '',
      subCity: watch('subCity') || '',
      kebele: watch('kebele') || '',
      landmark: watch('landmark') || '',
      deliveryAreas: watch('deliveryAreas') || [],
      freeDeliveryThreshold: watch('freeDeliveryThreshold'),
      facebook: watch('facebook') || '',
      instagram: watch('instagram') || '',
      telegram: watch('telegram') || '',
      tiktok: watch('tiktok') || '',
      website: watch('website') || '',
      hours: watch('hours') || [],
    };

    try {
      schema.parse(currentData);
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length && steps[nextIndex]) {
        setCurrentStep(steps[nextIndex].key);
      } else {
        await handleComplete();
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, [currentStep, currentStepIndex, watch]);

  const handleSkip = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length && steps[nextIndex]) {
      setCurrentStep(steps[nextIndex].key);
    } else {
      setCurrentStep('complete');
    }
  }, [currentStep, currentStepIndex]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0 && steps[prevIndex]) {
      setCurrentStep(steps[prevIndex].key);
    }
  }, [currentStepIndex]);

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      setCurrentStep('complete');
    } catch (error) {
      console.error('Failed to save shop setup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStep === 'complete') {
    return (
      <AuthLayout title="Shop Setup Complete" subtitle="Your shop is ready to go!">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-muted-foreground">
              Your shop "{watch('shopName') || ''}" has been set up successfully. You can now start listing your products.
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => router.push('/seller/catalog/new')} className="w-full">
              Add Your First Product
            </Button>
            <Button variant="outline" onClick={() => router.push('/seller/catalog')} className="w-full">
              Go to Catalog
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set Up Your Shop" subtitle="Complete your shop profile to start selling">
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</span>
            <span className="text-brand-gold font-medium">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{steps[currentStepIndex]?.title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStepIndex]?.description}</p>
          </div>

          {/* Step 1: Shop Name */}
          {currentStep === 'name' && (
            <div className="space-y-4">
              <FormInput
                label="Shop Name"
                placeholder="e.g., Habesha Fashion Boutique"
                {...register('shopName')}
                {...(errors.shopName?.message !== undefined && { error: errors.shopName.message })}
              />
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Tips for a great shop name</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Keep it short and memorable (3-5 words)</li>
                  <li>• Include your specialty (e.g., "Ethiopian Dresses")</li>
                  <li>• Use Amharic if targeting local customers</li>
                  <li>• Avoid numbers and special characters</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: About Shop */}
          {currentStep === 'about' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe your shop, what you sell, and what makes you unique..."
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 ${errors.description ? 'border-destructive' : 'border-input'}`}
                />
                {errors.description?.message !== undefined && (
                  <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{watch('description')?.length || 0}/1000 characters</p>
              </div>
            </div>
          )}

          {/* Step 5: Address */}
          {currentStep === 'address' && (
            <div className="space-y-4">
              <FormInput
                label="Street Address *"
                placeholder="e.g., Bole Road, Building 123"
                {...register('address')}
                {...(errors.address?.message !== undefined && { error: errors.address.message })}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">City *</label>
                <select
                  {...register('city')}
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 ${errors.city ? 'border-destructive' : 'border-input'}`}
                >
                  <option value="">Select city</option>
                  {ethiopianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city?.message !== undefined && (
                  <p className="text-xs text-destructive mt-1">{errors.city.message}</p>
                )}
              </div>
              <FormInput
                label="Sub-city"
                placeholder="e.g., Bole, Kazanchis"
                {...register('subCity')}
                {...(errors.subCity?.message !== undefined && { error: errors.subCity.message })}
              />
            </div>
          )}

          {/* Step 2: Logo */}
          {currentStep === 'logo' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-brand-gold/50 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-foreground mb-2">Upload your logo</p>
                <p className="text-xs text-muted-foreground mb-4">PNG, JPG, WebP, or SVG (max 5MB)</p>
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Logo best practices</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Use a square image (500x500px recommended)</li>
                  <li>• Keep it simple and recognizable at small sizes</li>
                  <li>• Use high contrast for visibility</li>
                  <li>• Include your brand colors</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Banner */}
          {currentStep === 'banner' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-brand-gold/50 transition-colors">
                <div className="w-full h-32 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                  <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-foreground mb-2">Upload your banner</p>
                <p className="text-xs text-muted-foreground mb-4">PNG, JPG, or WebP (max 10MB, 1200x400px recommended)</p>
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Banner best practices</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Use landscape orientation (3:1 ratio)</li>
                  <li>• Show your best products or shop interior</li>
                  <li>• Keep text minimal and readable</li>
                  <li>• Use good lighting and high resolution</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 6: Delivery Areas */}
          {currentStep === 'delivery' && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Delivery setup coming soon</p>
                <p className="text-muted-foreground">You'll be able to set up delivery zones, fees, and estimated times.</p>
              </div>
            </div>
          )}

          {/* Step 7: Social Links */}
          {currentStep === 'social' && (
            <div className="space-y-4">
              <FormInput
                label="Telegram"
                placeholder="https://t.me/yourshop"
                {...register('telegram')}
                {...(errors.telegram?.message !== undefined && { error: errors.telegram.message })}
              />
              <FormInput
                label="Facebook"
                placeholder="https://facebook.com/yourshop"
                {...register('facebook')}
                {...(errors.facebook?.message !== undefined && { error: errors.facebook.message })}
              />
              <FormInput
                label="Instagram"
                placeholder="https://instagram.com/yourshop"
                {...register('instagram')}
                {...(errors.instagram?.message !== undefined && { error: errors.instagram.message })}
              />
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Social media tips</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Telegram is very popular in Ethiopia for business</li>
                  <li>• Link to your business pages, not personal profiles</li>
                  <li>• Keep your social media active and updated</li>
                  <li>• Use consistent branding across platforms</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 8: Business Hours */}
          {currentStep === 'hours' && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Business hours setup coming soon</p>
                <p className="text-muted-foreground">You'll be able to set your operating hours for each day of the week.</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              Back
            </Button>
          )}
          {currentStepIndex >= 0 && steps[currentStepIndex]?.optional && (
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1"
            >
              Skip
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" /> Saving...
              </span>
            ) : currentStepIndex === steps.length - 1 ? (
              'Complete Setup'
            ) : (
              'Continue'
            )}
          </Button>
        </div>

        {/* Help Text */}
        {steps[currentStepIndex] && (
          <p className="text-center text-xs text-muted-foreground">
            You can edit all these settings later in your shop dashboard
          </p>
        )}
      </div>
    </AuthLayout>
  );
}

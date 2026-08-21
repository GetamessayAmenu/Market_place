'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent, Badge, Input } from '@marketplace/ui';
import useAuth from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verificationDocumentsSchema, sellerProfileSchema, promotionsSchema, type VerificationDocumentsInput, type SellerProfileInput, type PromotionsInput } from '../../lib/validations/seller';

// ─── Types ─────────────────────────────────────────────────────────────────

interface VerificationStatus {
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  documents: {
    businessLicense?: string;
    tin?: string;
    artisanCertificate?: string;
  };
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconShield = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconQR = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
  </svg>
);

const IconShare = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
);

// ─── Components ─────────────────────────────────────────────────────────────

function VerificationSection() {
  const [verification] = useState<VerificationStatus>({
    status: 'not_submitted',
    documents: {},
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationDocumentsInput>({
    resolver: zodResolver(verificationDocumentsSchema),
  });

  const statusConfig = {
    not_submitted: { color: 'bg-gray-100 text-gray-700', label: 'Not Submitted' },
    pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending Review' },
    verified: { color: 'bg-green-100 text-green-700', label: 'Verified' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
  };

  const { color, label } = statusConfig[verification.status];

  const handleSubmitVerification = (data: VerificationDocumentsInput) => {
    console.log('Verification documents:', data);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <IconShield />
          <h3 className="text-lg font-semibold">Verification & KYC</h3>
          <Badge className={color}>{label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your business documents to apply for the "Verified Designer / Authentic Habesha Seller" badge.
        </p>

        <form onSubmit={handleSubmit(handleSubmitVerification)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Business License</label>
            <input type="file" accept=".pdf,.jpg,.png" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Taxpayer Identification Number (TIN)</label>
            <input
              placeholder="Enter your TIN (10 digits)"
              {...register('tin')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.tin && <p className="text-destructive text-xs mt-1">{errors.tin.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Artisan Certificate (Optional)</label>
            <input type="file" accept=".pdf,.jpg,.png" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
          <Button type="submit" className="w-full">
            Submit for Verification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LocationSelector() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SellerProfileInput>({
    resolver: zodResolver(sellerProfileSchema),
  });

  const subCities = [
    { value: 'shiro_meda', label: 'Shiro Meda' },
    { value: 'bole', label: 'Bole' },
    { value: 'kazanchis', label: 'Kazanchis' },
    { value: 'merkato', label: 'Merkato' },
    { value: 'piassa', label: 'Piassa' },
  ];

  const regionalHubs = [
    { value: 'hawassa', label: 'Hawassa' },
    { value: 'bahir_dar', label: 'Bahir Dar' },
    { value: 'mekelle', label: 'Mekelle' },
    { value: 'dire_dawa', label: 'Dire Dawa' },
    { value: 'jimma', label: 'Jimma' },
  ];

  const handleSubmitLocation = (data: SellerProfileInput) => {
    console.log('Location data:', data);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Store Location</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select your location to help buyers find you. This will appear in location-based searches.
        </p>

        <form onSubmit={handleSubmit(handleSubmitLocation)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Addis Ababa Sub-City</label>
            <select
              {...register('location.subCity')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select sub-city</option>
              {subCities.map(city => (
                <option key={city.value} value={city.value}>{city.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Regional Hub</label>
            <select
              {...register('location.regionalHub')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select regional hub</option>
              {regionalHubs.map(hub => (
                <option key={hub.value} value={hub.value}>{hub.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Detailed Address</label>
            <input
              placeholder="Enter your full address"
              {...register('location.address')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.location?.address && <p className="text-destructive text-xs mt-1">{errors.location.address.message}</p>}
          </div>
          <Button type="submit" className="w-full">
            Update Location
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PromotionsSection() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromotionsInput>({
    resolver: zodResolver(promotionsSchema),
  });

  const handleSubmitPromotions = (data: PromotionsInput) => {
    console.log('Promotions data:', data);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Promotions & Banners</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Feature listings on your storefront and add promotional announcements.
        </p>

        <form onSubmit={handleSubmit(handleSubmitPromotions)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Pinned Listings</label>
            <select
              {...register('pinnedListings')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select listings to pin</option>
              <option value="1">Traditional Habesha Kemis</option>
              <option value="2">Ethiopian Gabi</option>
              <option value="3">Modern Dress</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Pinned listings appear at the top of your storefront.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Promotional Banner</label>
            <Input
              placeholder="e.g., Enkutatash Special: 20% off all custom orders!"
              {...register('bannerText')}
            />
            {errors.bannerText && <p className="text-destructive text-xs mt-1">{errors.bannerText.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              This banner will appear on your storefront.
            </p>
          </div>
          <Button type="submit" variant="outline" className="w-full">
            Save Promotions
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StorefrontShareSection() {
  const [storeUrl] = useState('https://habeshamarket.com/seller/abebe-designs');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
  };

  return (
    <Card id="share">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <IconQR />
          <h3 className="text-lg font-semibold">Storefront QR & Link</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Share your verified marketplace URL with customers.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Your Storefront URL</p>
            <div className="flex gap-2">
              <input
                value={storeUrl}
                readOnly
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <Button onClick={handleCopyLink}>
                <IconShare />
              </Button>
            </div>
          </div>

          <div className="flex justify-center p-6 bg-white rounded-lg border">
            {/* QR Code Placeholder */}
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
              <svg className="h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Download QR Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function StoreManagement() {
  const user = useAuth((s) => s.user);

  if (!user) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Please log in to manage your store profile.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <VerificationSection />
          <LocationSelector />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <PromotionsSection />
          <StorefrontShareSection />
        </div>
      </div>
    </div>
  );
}

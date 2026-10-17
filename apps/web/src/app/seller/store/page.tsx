'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Badge, Input } from '@marketplace/ui';
import useAuth from '../../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  verificationDocumentsSchema, 
  sellerProfileSchema, 
  type VerificationDocumentsInput, 
  type SellerProfileInput 
} from '../../../lib/validations/seller';
import { 
  useSellerProfile, 
  useUpdateSellerProfile, 
  useVerificationStatus, 
  useSubmitVerificationDocuments, 
  useSellerPromotions, 
  useUpdateSellerPromotions 
} from '../../../hooks/seller/useSellerProfile';
import { useMyListings } from '../../../hooks/useSeller';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconShield = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconQR = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
  </svg>
);

const IconShare = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
);

const IconCheck = () => (
  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// ─── Verification Section ───────────────────────────────────────────────────

function VerificationSection({ sellerId }: { sellerId: string }) {
  const { data: verification } = useVerificationStatus(sellerId);
  const submitDocsMutation = useSubmitVerificationDocuments();
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationDocumentsInput>({
    resolver: zodResolver(verificationDocumentsSchema),
  });

  const defaultStatusInfo = { 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', 
    label: 'Not Submitted',
    desc: 'Submit your business details or artisan identification to gain the "Verified Seller" badge.'
  };

  const statusConfig: Record<string, { color: string; label: string; desc: string }> = {
    not_submitted: defaultStatusInfo,
    pending: { 
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', 
      label: 'Under Review',
      desc: 'Your verification submission is currently under review by our marketplace team.'
    },
    verified: { 
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', 
      label: 'Verified Authentic',
      desc: 'Your store is verified! Your listings display the verified artisan badge to buyers.'
    },
    rejected: { 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', 
      label: 'Changes Required',
      desc: 'Your previous verification could not be completed. Please update your details and resubmit.'
    },
  };

  const currentStatus = verification?.status || 'not_submitted';
  const statusInfo = statusConfig[currentStatus] ?? defaultStatusInfo;

  const onSubmitVerification = (data: VerificationDocumentsInput) => {
    submitDocsMutation.mutate(
      {
        tin: data.tin,
        businessType: 'fashion_artisan',
      },
      {
        onSuccess: () => {
          setSuccessMsg('Verification documents submitted successfully for administrator review.');
          setTimeout(() => setSuccessMsg(''), 6000);
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <IconShield />
            </div>
            <h3 className="text-base font-semibold">Verification & KYC</h3>
          </div>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          {statusInfo.desc}
        </p>

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
            <IconCheck />
            <span>{successMsg}</span>
          </div>
        )}

        {currentStatus !== 'verified' && (
          <form onSubmit={handleSubmit(onSubmitVerification)} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium mb-1 block">
                Taxpayer Identification Number (TIN)
              </label>
              <input
                placeholder="Enter your 10-digit TIN"
                {...register('tin')}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {errors.tin && <p className="text-destructive text-xs mt-1">{errors.tin.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">
                Business License or Artisan ID (Optional notes)
              </label>
              <input
                placeholder="e.g., Trade license number or regional association membership"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitDocsMutation.isPending}
            >
              {submitDocsMutation.isPending ? 'Submitting...' : 'Submit Verification Request'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Location Selector ──────────────────────────────────────────────────────

function LocationSelector({ sellerId }: { sellerId: string }) {
  const { data: profile } = useSellerProfile(sellerId);
  const updateProfileMutation = useUpdateSellerProfile();
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SellerProfileInput>({
    resolver: zodResolver(sellerProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName || '',
        phone: profile.phone || '',
        location: {
          subCity: profile.location?.subCity || '',
          regionalHub: profile.location?.regionalHub || '',
          address: profile.location?.address || '',
        },
      });
    }
  }, [profile, reset]);

  const subCities = [
    { value: 'shiro_meda', label: 'Shiro Meda (Traditional Textile Hub)' },
    { value: 'bole', label: 'Bole' },
    { value: 'kazanchis', label: 'Kazanchis' },
    { value: 'merkato', label: 'Merkato' },
    { value: 'piassa', label: 'Piassa' },
    { value: 'yeka', label: 'Yeka' },
    { value: 'kirkos', label: 'Kirkos' },
  ];

  const regionalHubs = [
    { value: 'addis_ababa', label: 'Addis Ababa' },
    { value: 'hawassa', label: 'Hawassa' },
    { value: 'bahir_dar', label: 'Bahir Dar' },
    { value: 'mekelle', label: 'Mekelle' },
    { value: 'dire_dawa', label: 'Dire Dawa' },
    { value: 'gondar', label: 'Gondar' },
    { value: 'jimma', label: 'Jimma' },
  ];

  const onSubmitLocation = (data: SellerProfileInput) => {
    updateProfileMutation.mutate(
      {
        displayName: data.displayName,
        phone: data.phone || undefined,
        location: data.location
          ? {
              subCity: data.location.subCity || undefined,
              regionalHub: data.location.regionalHub || undefined,
              address: data.location.address || undefined,
            }
          : undefined,
      },
      {
        onSuccess: () => {
          setSuccessMsg('Store profile and location updated successfully.');
          setTimeout(() => setSuccessMsg(''), 5000);
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-base font-semibold mb-2">Store Profile & Location</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Help nearby buyers find your shop or studio for fittings, pickups, and rental returns.
        </p>

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
            <IconCheck />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitLocation)} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium mb-1 block">Store / Brand Name</label>
            <input
              placeholder="Your public brand name"
              {...register('displayName')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.displayName && <p className="text-destructive text-xs mt-1">{errors.displayName.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Contact Phone Number</label>
            <input
              placeholder="e.g., 0911234567"
              {...register('phone')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Regional Hub / City</label>
              <select
                {...register('location.regionalHub')}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select region</option>
                {regionalHubs.map(hub => (
                  <option key={hub.value} value={hub.value}>{hub.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Addis Ababa Sub-City</label>
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
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Physical Address / Landmark</label>
            <input
              placeholder="e.g., Shiro Meda, Next to St. George Church, Shop #14"
              {...register('location.address')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            {errors.location?.address && <p className="text-destructive text-xs mt-1">{errors.location.address.message}</p>}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? 'Updating...' : 'Save Location & Contact'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Promotions Section ─────────────────────────────────────────────────────

function PromotionsSection({ sellerId }: { sellerId: string }) {
  const { data: promotions } = useSellerPromotions(sellerId);
  const { data: myListingsRes } = useMyListings(sellerId);
  const updatePromotionsMutation = useUpdateSellerPromotions();
  const [successMsg, setSuccessMsg] = useState('');
  const [pinnedListingId, setPinnedListingId] = useState<string>('');
  const [bannerText, setBannerText] = useState<string>('');

  useEffect(() => {
    if (promotions) {
      setPinnedListingId(promotions.pinnedListings?.[0] || '');
      setBannerText(promotions.bannerText || '');
    }
  }, [promotions]);

  const rawListings: any[] = Array.isArray(myListingsRes)
    ? myListingsRes
    : Array.isArray((myListingsRes as any)?.data)
    ? (myListingsRes as any).data
    : Array.isArray((myListingsRes as any)?.items)
    ? (myListingsRes as any).items
    : [];

  const onSubmitPromotions = (e: React.FormEvent) => {
    e.preventDefault();
    updatePromotionsMutation.mutate(
      {
        pinnedListings: pinnedListingId ? [pinnedListingId] : [],
        bannerText: bannerText || undefined,
      },
      {
        onSuccess: () => {
          setSuccessMsg('Storefront announcement updated.');
          setTimeout(() => setSuccessMsg(''), 5000);
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-base font-semibold mb-2">Storefront Announcement</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Add an announcement banner and feature key pieces at the top of your public profile.
        </p>

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
            <IconCheck />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={onSubmitPromotions} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium mb-1 block">Featured / Pinned Listing</label>
            <select
              value={pinnedListingId}
              onChange={(e) => setPinnedListingId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">None (Display latest listings)</option>
              {rawListings.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.title} — ETB {Number(item.price || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Storefront Announcement Banner</label>
            <Input
              placeholder="e.g., Accepting custom bridal dress orders for the upcoming wedding season!"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            variant="outline" 
            className="w-full"
            disabled={updatePromotionsMutation.isPending}
          >
            {updatePromotionsMutation.isPending ? 'Saving...' : 'Update Announcement'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Storefront Share Section ───────────────────────────────────────────────

function StorefrontShareSection({ user }: { user: any }) {
  const [copied, setCopied] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const slugOrId = user.storeSlug || user.id;
      setStoreUrl(`${origin}/sellers/${slugOrId}`);
    }
  }, [user]);

  const handleCopyLink = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Card id="share">
      <CardContent className="p-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <IconQR />
          </div>
          <h3 className="text-base font-semibold">Storefront Link & Share</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Share your direct Habesha Market storefront link with buyers on WhatsApp, Telegram, or Instagram.
        </p>

        <div className="space-y-3.5">
          <div className="p-3 bg-muted/60 rounded-lg border">
            <p className="text-xs font-semibold mb-1.5 text-foreground">Your Public URL</p>
            <div className="flex gap-2">
              <input
                value={storeUrl}
                readOnly
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground"
              />
              <Button size="sm" onClick={handleCopyLink} className="gap-1 text-xs">
                {copied ? <IconCheck /> : <IconShare />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="flex justify-center p-6 bg-white dark:bg-muted/30 rounded-lg border">
            <div className="w-28 h-28 bg-muted rounded-lg flex flex-col items-center justify-center text-center p-2">
              <svg className="h-10 w-10 text-muted-foreground/60 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-3xs text-muted-foreground uppercase font-bold tracking-wider">Store QR</span>
            </div>
          </div>

          {storeUrl && (
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Open Public Storefront in New Tab ↗
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function StorePage() {
  const user = useAuth((s) => s.user);

  if (!user) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Please log in to manage your store profile.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b">
        <h1 className="font-display text-2xl font-bold tracking-tight">Store & Profile Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your seller verification, location details, customer announcements, and public storefront link.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <VerificationSection sellerId={user.id} />
          <LocationSelector sellerId={user.id} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <PromotionsSection sellerId={user.id} />
          <StorefrontShareSection user={user} />
        </div>
      </div>
    </div>
  );
}

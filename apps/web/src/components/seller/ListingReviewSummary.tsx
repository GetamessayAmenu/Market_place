"use client"
import { Alert, Badge, Divider } from '@marketplace/ui';
import React from 'react';

import type { UploadedImage } from '../../hooks/useSeller';

import type { DeliveryData } from './DeliveryOptions';
import type { ListingType } from './ListingTypeSelector';
import type { PricingData } from './PricingSection';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReviewData {
  listingType: ListingType;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  condition: string;
  city: string;
  tags: string[];
  images: UploadedImage[];
  pricing: PricingData;
  delivery: DeliveryData;
  contactOptions: {
    showPhone: boolean;
    whatsapp: string;
    telegram: string;
    inAppMessaging: boolean;
  };
}

interface ListingReviewSummaryProps {
  data: ReviewData;
}

const TYPE_LABELS: Record<ListingType, string> = {
  sale: 'Product for Sale',
  rent: 'Product for Rent',
  custom: 'Custom Design Service',
};

const TYPE_VARIANT: Record<ListingType, 'success' | 'warning' | 'info'> = {
  sale: 'success',
  rent: 'warning',
  custom: 'info',
};

const DELIVERY_LABELS: Record<string, string> = {
  pickup: 'Pickup only',
  delivery: 'Delivery only',
  both: 'Pickup or Delivery',
};

const PROCESSING_LABELS: Record<string, string> = {
  '1': 'Ready to ship (1 day)',
  '3': '2-3 business days',
  '7': '1 week',
  '14': '1-2 weeks',
  '30': 'Made to order (2-4 weeks)',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs font-medium text-muted-foreground shrink-0 w-32">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ListingReviewSummary({ data }: ListingReviewSummaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold">Review Your Listing</h3>
        <p className="mt-1 text-sm text-muted-foreground">Please review all details before publishing. You can go back to any step to make changes.</p>
      </div>

      {/* Type badge */}
      <div className="flex items-center gap-2">
        <Badge variant={TYPE_VARIANT[data.listingType]}>{TYPE_LABELS[data.listingType]}</Badge>
        {data.condition && (
          <Badge variant="outline" className="capitalize">{data.condition.replace('_', ' ')}</Badge>
        )}
      </div>

      {/* Basic info */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Basic Information</h4>
        <Divider className="my-2" />
        <Row label="Title" value={data.title || '—'} />
        <Row label="Category" value={data.categoryName || '—'} />
        <Row label="City" value={data.city || '—'} />
        <div className="py-2">
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{data.description || '—'}</p>
        </div>
        {data.tags.length > 0 && (
          <div className="py-2">
            <span className="text-xs font-medium text-muted-foreground">Tags</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {data.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Images */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Photos ({data.images.length})</h4>
        <Divider className="my-2" />
        {data.images.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {data.images.map((img, i) => (
              <div key={img.cloudinaryPublicId} className="relative overflow-hidden rounded-md border bg-muted">
                <div className="aspect-square">
                  <img src={img.url} alt={'Photo ' + String(i + 1)} className="h-full w-full object-cover" />
                </div>
                {i === 0 && (
                  <div className="absolute left-0.5 top-0.5 rounded bg-primary px-1 py-0.5 text-[9px] font-medium text-primary-foreground">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No photos uploaded</p>
        )}
      </section>

      {/* Pricing */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing</h4>
        <Divider className="my-2" />
        <Row label="Price" value={'$' + Number(data.pricing.price).toLocaleString()} />
        {data.listingType === 'sale' && data.pricing.compareAtPrice && (
          <Row label="Compare at" value={'$' + Number(data.pricing.compareAtPrice).toLocaleString()} />
        )}
        {data.listingType === 'rent' && data.pricing.rentalPricePerDay && (
          <Row label="Per day" value={'$' + Number(data.pricing.rentalPricePerDay).toLocaleString() + '/day'} />
        )}
        {data.listingType === 'rent' && data.pricing.rentalThreeDayRate && (
          <Row label="3-day event" value={'$' + Number(data.pricing.rentalThreeDayRate).toLocaleString()} />
        )}
        {data.listingType === 'rent' && data.pricing.rentalWeeklyRate && (
          <Row label="Weekly" value={'$' + Number(data.pricing.rentalWeeklyRate).toLocaleString()} />
        )}
        {data.listingType === 'rent' && data.pricing.rentalDeposit && (
          <Row label="Deposit" value={'$' + Number(data.pricing.rentalDeposit).toLocaleString()} />
        )}
        {data.listingType === 'custom' && data.pricing.estimatedProductionDays && (
          <Row label="Est. days" value={data.pricing.estimatedProductionDays} />
        )}
        {data.listingType === 'sale' && data.pricing.sku && (
          <Row label="SKU" value={data.pricing.sku} />
        )}
      </section>

      {/* Delivery & Availability */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery & Availability</h4>
        <Divider className="my-2" />
        <Row label="Delivery" value={DELIVERY_LABELS[data.delivery.deliveryMethod] ?? data.delivery.deliveryMethod} />
        {(data.delivery.deliveryMethod === 'delivery' || data.delivery.deliveryMethod === 'both') && data.delivery.deliveryFee && (
          <Row label="Delivery fee" value={'$' + Number(data.delivery.deliveryFee).toLocaleString()} />
        )}
        <Row label="Processing" value={PROCESSING_LABELS[data.delivery.processingDays] ?? data.delivery.processingDays + ' days'} />
        <div className="py-2">
          <span className="text-xs font-medium text-muted-foreground">Availability</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {data.delivery.availableForPurchase && <Badge variant="success">For Purchase</Badge>}
            {data.delivery.availableForRent && <Badge variant="warning">For Rent</Badge>}
            {data.delivery.customOrderAvailable && <Badge variant="info">Custom Orders</Badge>}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Options</h4>
        <Divider className="my-2" />
        <div className="flex flex-wrap gap-1.5">
          {data.contactOptions.showPhone && <Badge variant="outline">Phone</Badge>}
          {data.contactOptions.inAppMessaging && <Badge variant="outline">In-App Messaging</Badge>}
          {data.contactOptions.whatsapp && <Badge variant="outline">WhatsApp</Badge>}
          {data.contactOptions.telegram && <Badge variant="outline">Telegram</Badge>}
          {!data.contactOptions.showPhone && !data.contactOptions.inAppMessaging && !data.contactOptions.whatsapp && !data.contactOptions.telegram && (
            <p className="text-sm text-muted-foreground">No contact options selected</p>
          )}
        </div>
      </section>

      <Alert variant="info">
        After submission, your listing will be reviewed by our team before going live. This usually takes less than 24 hours.
      </Alert>
    </div>
  );
}

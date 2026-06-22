"use client"
import { Alert, Checkbox, FormInput, RadioGroup } from '@marketplace/ui';
import React from 'react';

import type { ListingType } from './ListingTypeSelector';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeliveryData {
  deliveryMethod: 'pickup' | 'delivery' | 'both';
  deliveryFee: string;
  processingDays: string;
  availableForPurchase: boolean;
  availableForRent: boolean;
  customOrderAvailable: boolean;
}

export const DEFAULT_DELIVERY: DeliveryData = {
  deliveryMethod: 'pickup',
  deliveryFee: '',
  processingDays: '3',
  availableForPurchase: true,
  availableForRent: false,
  customOrderAvailable: false,
};

interface DeliveryOptionsProps {
  listingType: ListingType;
  data: DeliveryData;
  onChange: (data: DeliveryData) => void;
  errors?: Record<string, string>;
}

const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Pickup only', description: 'Buyer collects from your location' },
  { value: 'delivery', label: 'Delivery only', description: 'You ship or deliver to buyer' },
  { value: 'both', label: 'Pickup or Delivery', description: 'Buyer can choose either option' },
];

const PROCESSING_OPTIONS = [
  { value: '1', label: '1 day (Ready to ship)' },
  { value: '3', label: '2-3 business days' },
  { value: '7', label: '1 week' },
  { value: '14', label: '1-2 weeks' },
  { value: '30', label: 'Made to order (2-4 weeks)' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DeliveryOptions({ listingType, data, onChange, errors }: DeliveryOptionsProps) {
  function update<K extends keyof DeliveryData>(key: K, value: DeliveryData[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-6">
      {/* Availability toggles */}
      <div>
        <h3 className="text-sm font-medium text-foreground">How can this item be obtained?</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Select all that apply. At least one must be enabled.</p>

        <div className="mt-3 space-y-2.5">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={data.availableForPurchase}
              onChange={(e) => { update('availableForPurchase', e.target.checked); }}
            />
            <div>
              <span className="text-sm font-medium text-foreground">Available for Purchase</span>
              <p className="text-xs text-muted-foreground">Buyers can buy this item at the listed price</p>
            </div>
          </label>

          {listingType !== 'custom' && (
            <label className="flex items-start gap-3">
              <Checkbox
                checked={data.availableForRent}
                onChange={(e) => { update('availableForRent', e.target.checked); }}
              />
              <div>
                <span className="text-sm font-medium text-foreground">Available for Rent</span>
                <p className="text-xs text-muted-foreground">Buyers can rent this item per day</p>
              </div>
            </label>
          )}

          {listingType !== 'rent' && (
            <label className="flex items-start gap-3">
              <Checkbox
                checked={data.customOrderAvailable}
                onChange={(e) => { update('customOrderAvailable', e.target.checked); }}
              />
              <div>
                <span className="text-sm font-medium text-foreground">Accept Custom Orders</span>
                <p className="text-xs text-muted-foreground">Buyers can request custom designs based on this listing</p>
              </div>
            </label>
          )}
        </div>

        {errors?.availability !== undefined && (
          <p className="mt-2 text-xs text-destructive">{errors.availability}</p>
        )}
      </div>

      {/* Delivery method */}
      <div>
        <h3 className="text-sm font-medium text-foreground">Delivery Method</h3>
        <div className="mt-3">
          <RadioGroup
            name="deliveryMethod"
            value={data.deliveryMethod}
            onChange={(value) => { update('deliveryMethod', value as DeliveryData['deliveryMethod']); }}
            options={DELIVERY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
              description: opt.description,
            }))}
          />
        </div>
      </div>

      {/* Delivery fee (shown if delivery or both selected) */}
      {(data.deliveryMethod === 'delivery' || data.deliveryMethod === 'both') && (
        <FormInput
          label="Delivery Fee ($)"
          type="number"
          placeholder="0.00"
          value={data.deliveryFee}
          onChange={(e) => { update('deliveryFee', e.target.value); }}
          {...(errors?.deliveryFee !== undefined && { error: errors.deliveryFee })}
        />
      )}

      {/* Processing time */}
      <div>
        <h3 className="text-sm font-medium text-foreground">Processing Time</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">How long before the item is ready to ship or pick up?</p>
        <div className="mt-3 space-y-2">
          {PROCESSING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="processingDays"
                value={opt.value}
                checked={data.processingDays === opt.value}
                onChange={(e) => { update('processingDays', e.target.value); }}
                className="h-3.5 w-3.5 border-border text-primary focus:ring-primary/30"
              />
              <span className="text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Info alert */}
      <Alert variant="info">
        {listingType === 'sale' && 'Your listing will appear in both the marketplace and search results once published.'}
        {listingType === 'rent' && 'Rental listings show the per-day price and security deposit to buyers.'}
        {listingType === 'custom' && 'Custom design listings allow buyers to submit bespoke order requests.'}
      </Alert>
    </div>
  );
}

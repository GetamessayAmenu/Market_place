"use client"
import { FormInput, FormTextarea } from '@marketplace/ui';
import React from 'react';

import type { ListingType } from './ListingTypeSelector';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingData {
  price: string;
  // Sale-specific
  compareAtPrice: string;
  sku: string;
  // Rent-specific
  rentalPricePerDay: string;
  rentalDeposit: string;
  minimumRentalDays: string;
  // Custom-specific
  startingCustomPrice: string;
  estimatedProductionDays: string;
  customizationNotes: string;
}

export const DEFAULT_PRICING: PricingData = {
  price: '',
  compareAtPrice: '',
  sku: '',
  rentalPricePerDay: '',
  rentalDeposit: '',
  minimumRentalDays: '1',
  startingCustomPrice: '',
  estimatedProductionDays: '14',
  customizationNotes: '',
};

interface PricingSectionProps {
  listingType: ListingType;
  data: PricingData;
  onChange: (data: PricingData) => void;
  errors?: Record<string, string>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PricingSection({ listingType, data, onChange, errors }: PricingSectionProps) {
  function update<K extends keyof PricingData>(key: K, value: PricingData[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-foreground">
          {listingType === 'sale' && 'Sale Price'}
          {listingType === 'rent' && 'Rental Pricing'}
          {listingType === 'custom' && 'Service Pricing'}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {listingType === 'sale' && 'Set the price for this item. Add a compare-at price to show a discount.'}
          {listingType === 'rent' && 'Set the daily rental rate and security deposit.'}
          {listingType === 'custom' && 'Set your starting price. Final pricing may vary based on customization.'}
        </p>
      </div>

      {/* Base price - all types */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          label={listingType === 'rent' ? 'Base Price ($)' : listingType === 'custom' ? 'Starting Price ($)' : 'Price ($)'}
          type="number"
          placeholder="0.00"
          value={data.price}
          onChange={(e) => { update('price', e.target.value); }}
          {...(errors?.price !== undefined && { error: errors.price })}
        />

        {/* Sale: compare-at price */}
        {listingType === 'sale' && (
          <FormInput
            label="Compare-at Price ($)"
            type="number"
            placeholder="Original price (optional)"
            value={data.compareAtPrice}
            onChange={(e) => { update('compareAtPrice', e.target.value); }}
          />
        )}

        {/* Rent: price per day */}
        {listingType === 'rent' && (
          <FormInput
            label="Price Per Day ($)"
            type="number"
            placeholder="0.00"
            value={data.rentalPricePerDay}
            onChange={(e) => { update('rentalPricePerDay', e.target.value); }}
            {...(errors?.rentalPricePerDay !== undefined && { error: errors.rentalPricePerDay })}
          />
        )}

        {/* Rent: deposit */}
        {listingType === 'rent' && (
          <FormInput
            label="Security Deposit ($)"
            type="number"
            placeholder="0.00"
            value={data.rentalDeposit}
            onChange={(e) => { update('rentalDeposit', e.target.value); }}
            {...(errors?.rentalDeposit !== undefined && { error: errors.rentalDeposit })}
          />
        )}

        {/* Rent: minimum days */}
        {listingType === 'rent' && (
          <FormInput
            label="Minimum Rental Days"
            type="number"
            placeholder="1"
            value={data.minimumRentalDays}
            onChange={(e) => { update('minimumRentalDays', e.target.value); }}
          />
        )}

        {/* Custom: starting price */}
        {listingType === 'custom' && (
          <FormInput
            label="Starting Price ($)"
            type="number"
            placeholder="0.00"
            value={data.startingCustomPrice}
            onChange={(e) => { update('startingCustomPrice', e.target.value); }}
          />
        )}

        {/* Custom: estimated days */}
        {listingType === 'custom' && (
          <FormInput
            label="Estimated Completion (days)"
            type="number"
            placeholder="14"
            value={data.estimatedProductionDays}
            onChange={(e) => { update('estimatedProductionDays', e.target.value); }}
          />
        )}
      </div>

      {/* Sale: SKU */}
      {listingType === 'sale' && (
        <FormInput
          label="SKU / Product Code"
          placeholder="Optional inventory reference"
          value={data.sku}
          onChange={(e) => { update('sku', e.target.value); }}
        />
      )}

      {/* Custom: customization notes */}
      {listingType === 'custom' && (
        <FormTextarea
          label="Customization Options"
          placeholder="Describe what buyers can customize (e.g. fabric choices, colors, measurements, styles)..."
          rows={4}
          value={data.customizationNotes}
          onChange={(e) => { update('customizationNotes', e.target.value); }}
        />
      )}

      {/* Pricing summary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pricing Summary</p>
        <div className="mt-2 space-y-1.5">
          {data.price && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {listingType === 'sale' ? 'Sale price' : listingType === 'rent' ? 'Base price' : 'Starting price'}
              </span>
              <span className="font-medium">${Number(data.price).toLocaleString()}</span>
            </div>
          )}
          {listingType === 'sale' && data.compareAtPrice && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Compare at</span>
              <span className="font-medium text-muted-foreground line-through">${Number(data.compareAtPrice).toLocaleString()}</span>
            </div>
          )}
          {listingType === 'rent' && data.rentalPricePerDay && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Per day</span>
              <span className="font-medium">${Number(data.rentalPricePerDay).toLocaleString()}/day</span>
            </div>
          )}
          {listingType === 'rent' && data.rentalDeposit && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Security deposit</span>
              <span className="font-medium">${Number(data.rentalDeposit).toLocaleString()}</span>
            </div>
          )}
          {listingType === 'custom' && data.estimatedProductionDays && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Est. completion</span>
              <span className="font-medium">{data.estimatedProductionDays} days</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

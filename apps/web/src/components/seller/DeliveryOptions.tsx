"use client"
import { Alert, Checkbox, FormInput, RadioGroup } from '@marketplace/ui';
import React, { useState } from 'react';

import type { ListingType } from './ListingTypeSelector';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeliveryData {
  deliveryMethod: 'pickup' | 'delivery' | 'both';
  deliveryFee: string;
  processingDays: string;
  availableForPurchase: boolean;
  availableForRent: boolean;
  customOrderAvailable: boolean;
  // Unified custom design fields
  supportsReadyMade: boolean;
  supportsCustomDesign: boolean;
  startingCustomPrice: string;
  estimatedProductionDays: string;
  customizationOptions: {
    requiresMeasurements: boolean;
    fabricTypes: string[];
    colors: string[];
    embroideryTypes: string[];
    customNotesAllowed: boolean;
  };
}

export const DEFAULT_DELIVERY: DeliveryData = {
  deliveryMethod: 'pickup',
  deliveryFee: '',
  processingDays: '3',
  availableForPurchase: true,
  availableForRent: false,
  customOrderAvailable: false,
  supportsReadyMade: true,
  supportsCustomDesign: false,
  startingCustomPrice: '',
  estimatedProductionDays: '',
  customizationOptions: {
    requiresMeasurements: false,
    fabricTypes: [],
    colors: [],
    embroideryTypes: [],
    customNotesAllowed: true,
  },
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
  const [showCustomConfig, setShowCustomConfig] = useState(false);

  function update<K extends keyof DeliveryData>(key: K, value: DeliveryData[K]) {
    onChange({ ...data, [key]: value });
  }

  function updateCustomOptions<K extends keyof DeliveryData['customizationOptions']>(key: K, value: DeliveryData['customizationOptions'][K]) {
    onChange({ ...data, customizationOptions: { ...data.customizationOptions, [key]: value } });
  }

  return (
    <div className="space-y-6">
      {/* Unified Selling & Fulfillment Options */}
      <div>
        <h3 className="text-sm font-medium text-foreground">Selling & Fulfillment Options</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Select all that apply. At least one must be enabled.</p>

        <div className="mt-3 space-y-2.5">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={data.supportsReadyMade}
              onChange={(e) => { update('supportsReadyMade', e.target.checked); }}
            />
            <div>
              <span className="text-sm font-medium text-foreground">Ready-made for Sale</span>
              <p className="text-xs text-muted-foreground">Buyers can purchase this item as-is</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <Checkbox
              checked={data.supportsCustomDesign}
              onChange={(e) => {
                update('supportsCustomDesign', e.target.checked);
                setShowCustomConfig(e.target.checked);
              }}
            />
            <div>
              <span className="text-sm font-medium text-foreground">Accept Custom Design Orders</span>
              <p className="text-xs text-muted-foreground">Buyers can request bespoke customization of this item</p>
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
        </div>

        {errors?.availability !== undefined && (
          <p className="mt-2 text-xs text-destructive">{errors.availability}</p>
        )}
      </div>

      {/* Progressive Disclosure: Custom Design Configuration Panel */}
      {showCustomConfig && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <h4 className="text-sm font-medium text-foreground">Custom Design Configuration</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">Configure the customization options for this listing</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Starting Custom Price (ETB)"
              type="number"
              placeholder="0.00"
              value={data.startingCustomPrice}
              onChange={(e) => { update('startingCustomPrice', e.target.value); }}
              {...(errors?.startingCustomPrice !== undefined && { error: errors.startingCustomPrice })}
            />

            <FormInput
              label="Estimated Production Time (Days)"
              type="number"
              placeholder="14"
              value={data.estimatedProductionDays}
              onChange={(e) => { update('estimatedProductionDays', e.target.value); }}
              {...(errors?.estimatedProductionDays !== undefined && { error: errors.estimatedProductionDays })}
            />
          </div>

          <div>
            <h5 className="text-xs font-medium text-foreground mb-2">Required Customer Inputs</h5>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={data.customizationOptions.requiresMeasurements}
                  onChange={(e) => { updateCustomOptions('requiresMeasurements', e.target.checked); }}
                />
                <span className="text-sm text-foreground">Body Measurements</span>
              </label>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={data.customizationOptions.fabricTypes.length > 0}
                  onChange={(e) => {
                    updateCustomOptions('fabricTypes', e.target.checked ? ['Cotton', 'Silk', 'Linen'] : []);
                  }}
                />
                <span className="text-sm text-foreground">Fabric Choice</span>
              </label>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={data.customizationOptions.colors.length > 0}
                  onChange={(e) => {
                    updateCustomOptions('colors', e.target.checked ? ['Black', 'White', 'Red', 'Blue', 'Green'] : []);
                  }}
                />
                <span className="text-sm text-foreground">Color Customization</span>
              </label>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={data.customizationOptions.embroideryTypes.length > 0}
                  onChange={(e) => {
                    updateCustomOptions('embroideryTypes', e.target.checked ? ['Tibeb', 'Cross-stitch', 'Beading'] : []);
                  }}
                />
                <span className="text-sm text-foreground">Embroidery/Tilf Style Notes</span>
              </label>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={data.customizationOptions.customNotesAllowed}
                  onChange={(e) => { updateCustomOptions('customNotesAllowed', e.target.checked); }}
                />
                <span className="text-sm text-foreground">Allow Custom Notes</span>
              </label>
            </div>
          </div>
        </div>
      )}

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

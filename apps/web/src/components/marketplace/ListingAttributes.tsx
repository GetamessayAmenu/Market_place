'use client';

import React, { useState } from 'react';
import { OCCASION_OPTIONS } from '@marketplace/types';

interface ListingAttributesProps {
  customizationOptions?: {
    requiresMeasurements: boolean;
    fabricTypes: string[];
    colors: string[];
    embroideryTypes: string[];
    customNotesAllowed: boolean;
  };
  attributes?: {
    size?: string;
    gender?: string;
    color?: string;
    brand?: string;
    material?: string;
    style?: string;
    occasions?: string[];
    occasion?: string;
    careInstructions?: string;
    weight?: string;
    dimensions?: string;
    deliveryFee?: number;
    deliveryAvailable?: boolean;
    pickupAvailable?: boolean;
  };
  condition?: string;
  category?: {
    name: string;
  };
}

const ListingAttributes = ({
  customizationOptions,
  attributes,
  condition,
  category,
}: ListingAttributesProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const occasionLabel =
    attributes?.occasions && attributes.occasions.length > 0
      ? attributes.occasions
          .map((occId) => {
            const opt = OCCASION_OPTIONS.find((o) => o.id === occId);
            return opt ? `${opt.icon} ${opt.label}` : occId;
          })
          .join(', ')
      : attributes?.occasion || null;

  // Collect all available product-specific attributes
  const attributeItems = [
    ...(occasionLabel ? [{ label: 'Occasion', value: occasionLabel }] : []),
    ...(attributes?.style ? [{ label: 'Style / Design', value: attributes.style }] : []),
    ...(attributes?.size ? [{ label: 'Size', value: attributes.size }] : []),
    ...(attributes?.gender ? [{ label: 'Gender', value: attributes.gender }] : []),
    ...(attributes?.color ? [{ label: 'Color', value: attributes.color }] : []),
    ...(attributes?.material ? [{ label: 'Material', value: attributes.material }] : []),
    ...(attributes?.deliveryAvailable
      ? [
          {
            label: 'Delivery',
            value: attributes.deliveryFee ? `ETB ${attributes.deliveryFee}` : 'Free delivery',
          },
        ]
      : []),
    ...(customizationOptions?.customNotesAllowed
      ? [{ label: 'Custom Notes', value: 'Allowed' }]
      : []),
    ...(attributes?.brand ? [{ label: 'Brand', value: attributes.brand }] : []),
    ...(condition ? [{ label: 'Condition', value: condition }] : []),
    ...(category?.name ? [{ label: 'Category', value: category.name }] : []),
    ...(customizationOptions?.fabricTypes?.length
      ? [{ label: 'Fabric Types', value: customizationOptions.fabricTypes.join(', ') }]
      : []),
    ...(customizationOptions?.colors?.length
      ? [{ label: 'Available Colors', value: customizationOptions.colors.join(', ') }]
      : []),
    ...(customizationOptions?.embroideryTypes?.length
      ? [{ label: 'Embroidery Types', value: customizationOptions.embroideryTypes.join(', ') }]
      : []),
    ...(customizationOptions?.requiresMeasurements
      ? [{ label: 'Measurements Required', value: 'Yes' }]
      : []),
  ];

  if (attributeItems.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-foreground text-sm font-semibold">Details</h4>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          {isVisible ? 'Hide' : 'Show more'}
        </button>
      </div>
      {isVisible && (
        <div className="space-y-2">
          {attributeItems.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}:</span>
              <span className="text-foreground font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingAttributes;

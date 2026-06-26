"use client"
import { useState } from 'react';

export type SellerType = 
  | 'individual'
  | 'boutique'
  | 'designer'
  | 'tailor'
  | 'rental'
  | 'manufacturer';

interface SellerTypeOption {
  id: SellerType;
  title: string;
  description: string;
  icon: string;
  features: string[];
  recommended?: boolean;
}

const sellerTypes: SellerTypeOption[] = [
  {
    id: 'individual',
    title: 'Individual Seller',
    description: 'Sell personal items, pre-owned fashion, or occasional pieces',
    icon: '👤',
    features: [
      'Quick setup',
      'No business license required',
      'Perfect for casual sellers',
      'Sell from your closet'
    ],
  },
  {
    id: 'boutique',
    title: 'Boutique',
    description: 'Run a curated fashion store with multiple collections',
    icon: '🏪',
    features: [
      'Brand your shop',
      'Manage inventory',
      'Build customer base',
      'Analytics dashboard'
    ],
    recommended: true,
  },
  {
    id: 'designer',
    title: 'Fashion Designer',
    description: 'Showcase and sell your original designs and collections',
    icon: '✨',
    features: [
      'Designer profile',
      'Portfolio showcase',
      'Custom collections',
      'Direct customer engagement'
    ],
  },
  {
    id: 'tailor',
    title: 'Tailor',
    description: 'Offer custom tailoring, alterations, and made-to-measure services',
    icon: '🧵',
    features: [
      'Service bookings',
      'Measurement profiles',
      'Before/after gallery',
      'Custom pricing'
    ],
  },
  {
    id: 'rental',
    title: 'Rental Business',
    description: 'Rent out fashion items for events, photoshoots, or special occasions',
    icon: '👗',
    features: [
      'Rental calendar',
      'Deposit management',
      'Damage protection',
      'Flexible pricing periods'
    ],
  },
  {
    id: 'manufacturer',
    title: 'Manufacturer',
    description: 'Produce and sell fashion items at scale with wholesale options',
    icon: '🏭',
    features: [
      'Bulk orders',
      'B2B marketplace',
      'Production tracking',
      'Wholesale pricing'
    ],
  },
];

interface SellerTypeSelectorProps {
  onSelect: (type: SellerType) => void;
  selectedType?: SellerType | null;
}

export default function SellerTypeSelector({ onSelect, selectedType }: SellerTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<SellerType | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choose Your Seller Type</h2>
        <p className="text-sm text-muted-foreground">
          Select the option that best describes your business. You can change this later.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sellerTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const isHovered = hoveredType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              onMouseEnter={() => setHoveredType(type.id)}
              onMouseLeave={() => setHoveredType(null)}
              className={`
                relative text-left p-5 rounded-xl border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-brand-gold bg-brand-gold/5 shadow-lg shadow-brand-gold/10' 
                  : 'border-border bg-card hover:border-brand-gold/50 hover:shadow-md'
                }
              `}
            >
              {/* Recommended Badge */}
              {type.recommended && (
                <div className="absolute -top-2 -right-2 bg-brand-gold text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                  Popular
                </div>
              )}

              {/* Icon & Title */}
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{type.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-base">{type.title}</h3>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-brand-gold flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {type.description}
              </p>

              {/* Features */}
              <ul className="space-y-1.5">
                {type.features.map((feature, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-brand-gold" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Hover/Diff Detail */}
              {(isHovered || isSelected) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-brand-gold font-medium">
                    {isSelected ? '✓ Selected' : 'Click to select'}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <p className="font-medium text-foreground mb-1">💡 Not sure?</p>
        <p className="text-muted-foreground">
          Start with "Individual Seller" and upgrade later. Most sellers begin here and switch as they grow.
        </p>
      </div>
    </div>
  );
}

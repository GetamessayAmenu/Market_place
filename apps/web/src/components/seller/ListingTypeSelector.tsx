"use client"
import { cn } from '@marketplace/ui';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ListingType = 'sale' | 'rent' | 'custom';

interface ListingTypeSelectorProps {
  value: ListingType | null;
  onChange: (type: ListingType) => void;
  disabled?: boolean;
}

const TYPES: { id: ListingType; title: string; description: string; color: string; borderColor: string; iconBg: string; icon: React.ReactNode }[] = [
  {
    id: 'sale',
    title: 'Product for Sale',
    description: 'Sell a product with a fixed price. Buyers can purchase directly.',
    color: 'text-brand-green',
    borderColor: 'peer-checked:border-brand-green peer-checked:ring-2 peer-checked:ring-brand-green/20',
    iconBg: 'bg-brand-green/10',
    icon: (
      <svg className="h-6 w-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    id: 'rent',
    title: 'Product for Rent',
    description: 'Rent out a product per day. Includes a refundable security deposit.',
    color: 'text-brand-gold',
    borderColor: 'peer-checked:border-brand-gold peer-checked:ring-2 peer-checked:ring-brand-gold/20',
    iconBg: 'bg-brand-gold/10',
    icon: (
      <svg className="h-6 w-6 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'custom',
    title: 'Custom Design Service',
    description: 'Offer bespoke design and tailoring services. Buyers submit custom orders.',
    color: 'text-brand-wine',
    borderColor: 'peer-checked:border-brand-wine peer-checked:ring-2 peer-checked:ring-brand-wine/20',
    iconBg: 'bg-brand-wine/10',
    icon: (
      <svg className="h-6 w-6 text-brand-wine" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ListingTypeSelector({ value, onChange, disabled }: ListingTypeSelectorProps) {
  return (
    <div>
      <h2 className="text-lg font-display font-semibold text-foreground">What are you listing?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose the type that best describes your offering.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {TYPES.map((type) => (
          <label
            key={type.id}
            className={cn(
              'peer relative cursor-pointer rounded-xl border-2 bg-background p-5 transition-all hover:shadow-md',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/40',
              type.borderColor,
              disabled && 'pointer-events-none opacity-50'
            )}
          >
            <input
              type="radio"
              name="listingType"
              className="sr-only peer"
              checked={value === type.id}
              onChange={() => { onChange(type.id); }}
              disabled={disabled}
            />
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', type.iconBg)}>
              {type.icon}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">{type.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{type.description}</p>
            {value === type.id && (
              <div className={cn('absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full', type.iconBg)}>
                <svg className={cn('h-3 w-3', type.color)} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

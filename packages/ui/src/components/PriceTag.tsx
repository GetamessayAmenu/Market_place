import React, { forwardRef } from 'react';

import { cn } from '../lib/cn';

export type PriceVariant = 'buy' | 'rent' | 'custom';
export type Currency = 'ETB' | 'USD' | 'EUR';

export interface PriceTagProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Price in minor units (cents/santim) */
  amount: number;
  currency?: Currency;
  variant?: PriceVariant;
  /** Original price before discount (shows strikethrough) */
  originalAmount?: number;
  /** Discount percentage to display */
  discount?: number;
  /** Compact mode — smaller text */
  compact?: boolean;
}

const currencySymbols: Record<Currency, string> = {
  ETB: 'ETB',
  USD: '$',
  EUR: '\u20AC',
};

const variantLabels: Record<PriceVariant, string> = {
  buy: '',
  rent: '/day',
  custom: 'from',
};

const variantColorClasses: Record<PriceVariant, string> = {
  buy: 'text-action-buy',
  rent: 'text-action-rent',
  custom: 'text-action-custom',
};

function formatPrice(amount: number, currency: Currency): string {
  const value = amount / 100;
  if (currency === 'USD' || currency === 'EUR') {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const PriceTag = forwardRef<HTMLDivElement, PriceTagProps>(
  ({ className, amount, currency = 'ETB', variant = 'buy', originalAmount, discount, compact, ...props }, ref) => {
    const symbol = currencySymbols[currency];
    const label = variantLabels[variant];
    const colorClass = variantColorClasses[variant];
    const hasDiscount = originalAmount !== undefined && originalAmount > amount;

    return (
      <div
        ref={ref}
        className={cn('flex items-baseline gap-1.5', className)}
        {...props}
      >
        {label && variant === 'custom' && (
          <span className={cn('text-muted-foreground', compact ? 'text-2xs' : 'text-xs')}>{label}</span>
        )}

        <span className={cn('font-semibold', colorClass, compact ? 'text-sm' : 'text-lg')}>
          {symbol}
          {currency === 'ETB' ? ' ' : ''}
          {formatPrice(amount, currency)}
        </span>

        {label && variant === 'rent' && (
          <span className={cn('text-muted-foreground', compact ? 'text-2xs' : 'text-xs')}>{label}</span>
        )}

        {hasDiscount && originalAmount && (
          <span className={cn('text-muted-foreground line-through', compact ? 'text-2xs' : 'text-xs')}>
            {symbol}{currency === 'ETB' ? ' ' : ''}{formatPrice(originalAmount, currency)}
          </span>
        )}

        {discount !== undefined && discount > 0 && (
          <span className={cn(
            'inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-2xs font-medium text-destructive'
          )}>
            -{discount}%
          </span>
        )}
      </div>
    );
  }
);

PriceTag.displayName = 'PriceTag';

export { PriceTag };

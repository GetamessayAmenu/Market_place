import React, { forwardRef } from 'react';

import { cn } from '../lib/cn';
import { cva } from '../lib/cva';

const badgeVariants = cva({
  base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      success: 'border-transparent bg-success/10 text-success',
      warning: 'border-transparent bg-warning/10 text-warning',
      error: 'border-transparent bg-destructive/10 text-destructive',
      info: 'border-transparent bg-info/10 text-info',
      outline: 'text-foreground',
      /* Marketplace action badges */
      buy: 'border-transparent bg-action-buy/10 text-action-buy',
      rent: 'border-transparent bg-action-rent/10 text-action-rent',
      custom: 'border-transparent bg-action-custom/10 text-action-custom',
      /* Marketplace status badges */
      'new-arrival': 'border-transparent bg-brand-green/10 text-brand-green',
      featured: 'border-transparent bg-brand-gold/15 text-brand-gold',
      'sold-out': 'border-transparent bg-muted text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'outline'
    | 'buy'
    | 'rent'
    | 'custom'
    | 'new-arrival'
    | 'featured'
    | 'sold-out';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ ...(variant !== undefined && { variant }), ...(className !== undefined && { className }) }))}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };

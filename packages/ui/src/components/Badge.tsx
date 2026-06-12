import React, { forwardRef } from 'react';
import { cn } from '../lib/cn.js';
import { cva } from '../lib/cva.js';

const badgeVariants = cva({
  base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
      success: 'border-transparent bg-success text-success-foreground hover:bg-success/80',
      warning: 'border-transparent bg-warning text-warning-foreground hover:bg-warning/80',
      error: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
      info: 'border-transparent bg-info text-info-foreground hover:bg-info/80',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return (
    <div ref={ref} className={cn(badgeVariants({ ...(variant !== undefined && { variant }) }), className)} {...props} />
  );
});

Badge.displayName = 'Badge';

export { Badge, badgeVariants };

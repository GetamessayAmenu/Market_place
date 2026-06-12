import React, { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(({ className, variant = 'rectangular', ...props }, ref) => {
  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-muted',
        variantClasses[variant],
        variant === 'text' && 'h-4 w-3/4',
        variant === 'circular' && 'h-10 w-10',
        variant === 'rectangular' && 'h-20 w-full',
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };

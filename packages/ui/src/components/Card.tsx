import React, { forwardRef } from 'react';

import { cn } from '../lib/cn';

export type CardVariant = 'default' | 'product' | 'designer';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'rounded-lg border bg-card text-card-foreground shadow-sm',
  product: 'rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden group',
  designer: 'rounded-lg border bg-card text-card-foreground shadow-sm text-center',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variantClasses[variant],
        hover && 'transition-all duration-200 hover:shadow-lg cursor-pointer hover:-translate-y-0.5',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

/** Image wrapper for product cards — enforces 3:4 aspect ratio typical for fashion */
const CardImage = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative aspect-[3/4] overflow-hidden', className)} {...props} />
  )
);
CardImage.displayName = 'CardImage';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardImage };

import { cn, EmptyState } from '@marketplace/ui';
import React from 'react';

export type ProductGridVariant = 'standard' | 'compact' | 'featured';

export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ProductGridVariant;
  loading?: boolean;
  skeletonCount?: number;
  skeletonComponent?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

const gridClasses: Record<ProductGridVariant, string> = {
  standard: 'grid-cols-2 fashion-sm:grid-cols-3 fashion-md:grid-cols-4 fashion-xl:grid-cols-5 gap-4',
  compact: 'grid-cols-2 fashion-sm:grid-cols-3 fashion-md:grid-cols-4 fashion-xl:grid-cols-5 gap-3',
  featured: 'grid-cols-1 fashion-sm:grid-cols-2 fashion-md:grid-cols-3 gap-6',
};

export default function ProductGrid({
  variant = 'standard',
  loading,
  skeletonCount = 10,
  skeletonComponent,
  emptyTitle = 'No fashions found',
  emptyDescription = 'Try adjusting your filters or search terms.',
  emptyAction,
  children,
  className,
  ...props
}: ProductGridProps) {
  const childArray = React.Children.toArray(children);
  const isEmpty = !loading && childArray.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className="py-16"
      />
    );
  }

  return (
    <div
      className={cn('grid', gridClasses[variant], className)}
      role="list"
      {...props}
    >
      {loading && skeletonComponent
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} role="listitem" aria-hidden="true">
              {skeletonComponent}
            </div>
          ))
        : childArray.map((child, i) => (
            <div key={i} role="listitem">
              {child}
            </div>
          ))
      }
    </div>
  );
}

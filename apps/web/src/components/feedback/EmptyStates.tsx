import { Button, EmptyState } from '@marketplace/ui';
import React from 'react';

// ─── Icons (fashion-themed SVGs) ─────────────────────────────────────────────

function FashionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.077c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.911-1.1c-.801-.062-1.429-.628-1.672-1.361a3.097 3.097 0 01-.175-1.123A5.962 5.962 0 0013.154 8.4l-.072-.216a1.09 1.09 0 00-.96-.784H9.59a1.09 1.09 0 01-.959-.576L8.27 6.22A.91.91 0 007.478 5.7H6.65a.545.545 0 00-.535.49z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

// ─── Empty State Variants ─────────────────────────────────────────────────────

type MarketplaceEmptyVariant = 'no-products' | 'no-favorites' | 'no-listings' | 'no-results';

export interface MarketplaceEmptyStateProps {
  variant: MarketplaceEmptyVariant;
  onAction?: () => void;
  className?: string;
}

const variantConfig: Record<
  MarketplaceEmptyVariant,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
  }
> = {
  'no-products': {
    icon: <FashionIcon className="h-8 w-8" />,
    title: 'No fashions found',
    description: 'There are no listings in this category yet. Be the first to showcase your designs!',
    actionLabel: 'Browse All Categories',
  },
  'no-favorites': {
    icon: <HeartIcon className="h-8 w-8" />,
    title: 'No saved items yet',
    description: 'Start exploring and save your favorite fashions, designers, and rentals.',
    actionLabel: 'Explore Fashions',
  },
  'no-listings': {
    icon: <StoreIcon className="h-8 w-8" />,
    title: 'Start selling your designs',
    description: 'Create your first listing and reach thousands of fashion lovers across Ethiopia.',
    actionLabel: 'Create Listing',
  },
  'no-results': {
    icon: <SearchIcon className="h-8 w-8" />,
    title: 'No results found',
    description: 'Try different search terms, adjust your filters, or browse our categories.',
    actionLabel: 'Clear Filters',
  },
};

function MarketplaceEmptyState({ variant, onAction, className }: MarketplaceEmptyStateProps) {
  const config = variantConfig[variant];

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      className={className}
      action={
        onAction && config.actionLabel ? (
          <Button onClick={onAction} variant="outline">
            {config.actionLabel}
          </Button>
        ) : undefined
      }
      role="status"
    />
  );
}

export { MarketplaceEmptyState };
export type { MarketplaceEmptyVariant };

import { cn } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

type CategoryCardVariant = 'standard' | 'wide' | 'tall';

export interface CategoryCardProps {
  slug: string;
  name: string;
  imageUrl?: string | null;
  listingCount?: number;
  variant?: CategoryCardVariant;
  className?: string;
}

const variantAspect: Record<CategoryCardVariant, string> = {
  standard: 'aspect-[3/2]',
  wide: 'aspect-[2/1]',
  tall: 'aspect-[3/4]',
};

export default function CategoryCard({
  slug,
  name,
  imageUrl,
  listingCount,
  variant = 'standard',
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={'/categories/' + slug}
      className={cn(
        'group relative block overflow-hidden rounded-xl shadow-sm transition-all duration-300',
        'hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2',
        className
      )}
      aria-label={
        listingCount !== undefined
          ? name + ' – ' + String(listingCount) + ' listing' + (listingCount !== 1 ? 's' : '')
          : name
      }
    >
      {/* Image */}
      <div className={cn('relative w-full bg-muted', variantAspect[variant])}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay with brand-gold tint */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
            'group-hover:from-black/80'
          )}
        />
        {/* Gold tint accent at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-gold/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-lg font-semibold text-white drop-shadow-sm sm:text-xl">
          {name}
        </h3>
        {listingCount !== undefined && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-white/80">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>
              {String(listingCount)} listing{listingCount !== 1 ? 's' : ''}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}

import { Badge, cn } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

export interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | null;
  city?: string;
  condition?: string;
  isFavorited?: boolean;
  className?: string;
}

const conditionVariant: Record<string, 'default' | 'secondary' | 'success' | 'info'> = {
  new: 'success',
  like_new: 'info',
  good: 'default',
  fair: 'secondary',
  poor: 'secondary',
};

export default function ListingCard({
  id,
  title,
  price,
  imageUrl,
  city,
  condition,
  isFavorited,
  className,
}: ListingCardProps) {
  return (
    <Link href={'/listings/' + id}>
      <article
        className={cn(
          'group rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md',
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Favorite button */}
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-background/80 p-2 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            onClick={(e) => { e.preventDefault(); }}
          >
            <svg
              className={cn('h-4 w-4', isFavorited ? 'fill-destructive text-destructive' : 'text-foreground')}
              fill={isFavorited ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Condition badge */}
          {condition && (
            <div className="absolute left-2 top-2">
              <Badge variant={conditionVariant[condition] ?? 'default'}>{condition.replace('_', ' ')}</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
          <p className="mt-1 text-lg font-bold text-foreground">
            ${price.toLocaleString()}
          </p>
          {city && (
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {city}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

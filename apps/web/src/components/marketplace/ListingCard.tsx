"use client"

import { Avatar, Badge, cn, PriceTag, Tag } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

export type ListingType = 'buy' | 'rent' | 'custom';

export interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  currency?: 'ETB' | 'USD' | 'EUR';
  imageUrl?: string | null;
  listingType?: ListingType;
  designerName?: string;
  designerAvatar?: string | null;
  designerId?: string;
  status?: 'new-arrival' | 'featured' | 'sold-out';
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  originalPrice?: number;
  discount?: number;
  className?: string;
  // Unified custom design fields
  supportsReadyMade?: boolean;
  supportsCustomDesign?: boolean;
  startingCustomPrice?: number | null;
}

const typeLabels: Record<ListingType, string> = {
  buy: 'Buy',
  rent: 'Rent',
  custom: 'Custom',
};

export default function ListingCard({
  id,
  title,
  price,
  currency = 'ETB',
  imageUrl,
  listingType = 'buy',
  designerName,
  designerAvatar,
  designerId,
  status,
  isFavorited,
  onToggleFavorite,
  originalPrice,
  discount,
  className,
  supportsReadyMade = true,
  supportsCustomDesign = false,
  startingCustomPrice,
}: ListingCardProps) {
  const isSold = status === 'sold-out';
  const showBadges = supportsReadyMade || supportsCustomDesign;

  return (
    <Link href={'/listings/' + id} className="group block" aria-label={title}>
      <article
        className={cn(
          'relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm',
          'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
          status === 'featured' && 'ring-1 ring-brand-gold/40',
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Sold out overlay */}
          {isSold && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Sold Out</span>
            </div>
          )}

          {/* Favorite button */}
          {!isSold && (
            <button
              type="button"
              className={cn(
                'absolute right-2 top-2 rounded-full bg-background/80 backdrop-blur-sm p-2',
                'opacity-0 transition-all group-hover:opacity-100',
                'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isFavorited && 'opacity-100'
              )}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite?.();
              }}
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
          )}

          {/* Status badge */}
          {status && !isSold && (
            <div className="absolute left-2 top-2">
              <Badge variant={status}>
                {status === 'new-arrival' ? 'New' : 'Featured'}
              </Badge>
            </div>
          )}

          {/* Unified capability badges - show below status badge or at top-left if no status */}
          {showBadges && !isSold && !status && (
            <div className="absolute left-2 top-2 flex flex-col gap-1">
              {supportsReadyMade && (
                <Badge variant="secondary" className="text-xs">
                  Ready-made
                </Badge>
              )}
              {supportsCustomDesign && (
                <Badge variant="outline" className="text-xs bg-brand-gold/10 border-brand-gold/30 text-brand-gold">
                  Custom Design
                </Badge>
              )}
            </div>
          )}

          {/* Listing type tag */}
          <div className="absolute left-2 bottom-2">
            <Tag variant={listingType} size="sm">{typeLabels[listingType]}</Tag>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">{title}</h3>

          <PriceTag
            amount={price}
            currency={currency}
            variant={listingType}
            {...(originalPrice !== undefined ? { originalAmount: originalPrice } : {})}
            {...(discount !== undefined ? { discount } : {})}
            compact
          />

          {/* Designer info */}
          {designerName && (
            <div className="flex items-center gap-2 pt-1">
              <Avatar
                name={designerName}
                size="sm"
                {...(designerAvatar !== undefined && { src: designerAvatar })}
              />
              {designerId ? (
                <span className="text-xs text-muted-foreground truncate">{designerName}</span>
              ) : (
                <span className="text-xs text-muted-foreground truncate">{designerName}</span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

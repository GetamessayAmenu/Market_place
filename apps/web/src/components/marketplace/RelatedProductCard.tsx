"use client"

import { Badge, cn, PriceTag, Tag } from '@marketplace/ui';
import Link from 'next/link';
import React from 'react';

export type ListingType = 'buy' | 'rent' | 'custom';

export interface RelatedProductCardProps {
  id: string;
  title: string;
  price: number;
  currency?: 'ETB' | 'USD' | 'EUR';
  images?: readonly { url: string; isPrimary: boolean }[];
  city?: string | null;
  isFavorited?: boolean;
  availableForPurchase?: boolean;
  availableForRent?: boolean;
  customOrderAvailable?: boolean;
  supportsReadyMade?: boolean;
  supportsCustomDesign?: boolean;
  rentalPricePerDay?: number | null;
  className?: string;
}

const typeLabels: Record<ListingType, string> = {
  buy: 'Buy',
  rent: 'Rent',
  custom: 'Custom',
};

export default function RelatedProductCard({
  id,
  title,
  price,
  currency = 'ETB',
  images,
  city,
  isFavorited: _isFavorited,
  availableForPurchase: _availableForPurchase = true,
  availableForRent = false,
  customOrderAvailable = false,
  supportsReadyMade = true,
  supportsCustomDesign = false,
  rentalPricePerDay,
  className,
}: RelatedProductCardProps) {
  const primaryImage = images?.find((img) => img.isPrimary) || images?.[0];
  const imageUrl = primaryImage?.url;
  const showBadges = supportsReadyMade || supportsCustomDesign;

  // Determine listing type based on availability flags
  let listingType: ListingType = 'buy';
  if (customOrderAvailable) {
    listingType = 'custom';
  } else if (availableForRent) {
    listingType = 'rent';
  }

  return (
    <Link href={'/listings/' + id} className="group block" aria-label={title}>
      <article
        className={cn(
          'relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm',
          'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
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

          {/* Unified capability badges */}
          {showBadges && (
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
            compact
          />

          {rentalPricePerDay && (
            <p className="text-xs text-muted-foreground">
              or {currency}{rentalPricePerDay.toLocaleString()}/day
            </p>
          )}

          {city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

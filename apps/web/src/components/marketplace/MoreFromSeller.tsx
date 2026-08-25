"use client"

import Link from 'next/link';
import React from 'react';

import RelatedProductCard from './RelatedProductCard';
import type { RelatedProductCardProps } from './RelatedProductCard';

export interface SellerInfo {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface MoreFromSellerProps {
  listings: RelatedProductCardProps[];
  seller: SellerInfo;
}

export default function MoreFromSeller({ listings, seller }: MoreFromSellerProps) {
  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-labelledby="more-from-seller-heading">
      <div className="flex items-center justify-between">
        <h2 id="more-from-seller-heading" className="text-lg font-semibold text-foreground">
          More from {seller.displayName}
        </h2>
        <Link
          href={`/sellers/${seller.id}`}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          View Store
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Horizontal scroll container for mobile, grid for desktop */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 snap-x snap-mandatory">
        {listings.map((listing) => (
          <div key={listing.id} className="flex-shrink-0 w-[160px] snap-start lg:w-auto lg:flex-shrink-0">
            <RelatedProductCard {...listing} />
          </div>
        ))}
      </div>
    </section>
  );
}

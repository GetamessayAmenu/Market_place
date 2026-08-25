"use client"

import React from 'react';

import RelatedProductCard from './RelatedProductCard';
import type { RelatedProductCardProps } from './RelatedProductCard';

export interface YouMayAlsoLikeProps {
  listings: RelatedProductCardProps[];
}

export default function YouMayAlsoLike({ listings }: YouMayAlsoLikeProps) {
  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-labelledby="you-may-also-like-heading">
      <h2 id="you-may-also-like-heading" className="text-lg font-semibold text-foreground">
        You may also like
      </h2>

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

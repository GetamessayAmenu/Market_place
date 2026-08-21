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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => (
          <RelatedProductCard key={listing.id} {...listing} />
        ))}
      </div>
    </section>
  );
}

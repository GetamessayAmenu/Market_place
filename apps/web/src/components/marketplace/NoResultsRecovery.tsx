"use client"

import React from 'react'
import Link from 'next/link'
import ListingCard from './ListingCard'

interface NoResultsRecoveryProps {
  query?: string
  onSelectSearch?: (query: string) => void
  onClearFilters?: () => void
  recommendedListings?: any[]
}

const POPULAR_SUGGESTED_TERMS = [
  'Habesha Kemis',
  'Bridal Wear',
  'Zuria',
  'Netela',
  'Men Suits',
  'Rentals',
  'Custom Orders',
]

const FEATURED_CATEGORIES = [
  { name: "Women's Fashion", query: "Women's Fashion" },
  { name: "Men's Fashion", query: "Men's Fashion" },
  { name: "Baby & Kids", query: "Baby & Kids" },
  { name: "Traditional Accessories", query: "Accessories" },
]

export default function NoResultsRecovery({
  query,
  onSelectSearch,
  onClearFilters,
  recommendedListings = [],
}: NoResultsRecoveryProps) {
  return (
    <div className="rounded-2xl border bg-card p-6 md:p-10 space-y-8">
      {/* Primary Message */}
      <div className="text-center max-w-md mx-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold mb-4">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-foreground">
          {query ? `No exact matches for "${query}"` : 'No items match your selected filters'}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Don't worry! Try refining your search, exploring popular categories, or browsing recommended Ethiopian fashion below.
        </p>

        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Related Searches / Suggestions */}
      <div className="border-t pt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Popular & Related Searches
        </h4>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SUGGESTED_TERMS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSelectSearch?.(term)}
              className="rounded-full border bg-background hover:bg-accent px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors"
            >
              🔍 {term}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Categories */}
      <div className="border-t pt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Explore Categories
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURED_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectSearch?.(cat.query)}
              className="rounded-xl border bg-muted/30 p-3 text-left hover:bg-accent hover:border-brand-gold/40 transition-all group"
            >
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                {cat.name}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Browse items &rarr;</span>
            </button>
          ))}
        </div>
      </div>

      {/* Useful Real Recommendations */}
      {recommendedListings.length > 0 && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground">
              You Might Also Like
            </h4>
            <Link href="/search" className="text-xs font-semibold text-primary hover:underline">
              View all marketplace items &rarr;
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedListings.slice(0, 3).map((item) => (
              <ListingCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={Number(item.price)}
                location={item.city || item.location}
                availableForRent={item.availableForRent}
                rentalPricePerDay={item.rentalPricePerDay ? Number(item.rentalPricePerDay) : null}
                supportsCustomDesign={item.supportsCustomDesign}
                {...(item.primaryImageUrl ? { imageUrl: item.primaryImageUrl } : {})}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

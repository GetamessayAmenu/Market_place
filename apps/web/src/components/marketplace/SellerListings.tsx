"use client"
import { cn } from '@marketplace/ui'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'

import ListingCard, { type ListingCardProps, type ListingType } from './ListingCard'

export interface SellerListing extends ListingCardProps {
  availableForPurchase?: boolean
  availableForRent?: boolean
  customOrderAvailable?: boolean
  createdAt: string
}

export interface SellerListingsProps {
  listings: SellerListing[]
  sellerName: string
  className?: string
}

type TabKey = 'all' | ListingType
type SortKey = 'newest' | 'price-asc' | 'price-desc'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'buy', label: 'For Sale' },
  { key: 'rent', label: 'For Rent' },
  { key: 'custom', label: 'Custom' },
]

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
]

function getListingType(listing: SellerListing): ListingType {
  if (listing.availableForPurchase) return 'buy'
  if (listing.availableForRent) return 'rent'
  if (listing.customOrderAvailable) return 'custom'
  return listing.listingType ?? 'buy'
}

export default function SellerListings({ listings, sellerName, className }: SellerListingsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')

  const filtered = useMemo(() => {
    let items = listings

    // Filter by tab
    if (activeTab !== 'all') {
      items = items.filter((l) => {
        if (activeTab === 'buy') return l.availableForPurchase
        if (activeTab === 'rent') return l.availableForRent
        return l.customOrderAvailable
      })
    }

    // Sort
    if (sortBy === 'price-asc') {
      items = [...items].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      items = [...items].sort((a, b) => b.price - a.price)
    } else {
      items = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return items
  }, [listings, activeTab, sortBy])

  const tabCounts = useMemo(() => ({
    all: listings.length,
    buy: listings.filter((l) => l.availableForPurchase).length,
    rent: listings.filter((l) => l.availableForRent).length,
    custom: listings.filter((l) => l.customOrderAvailable).length,
  }), [listings])

  return (
    <section className={cn('space-y-6', className)} aria-labelledby="seller-listings-heading">
      <div className="flex items-center justify-between">
        <h2 id="seller-listings-heading" className="text-lg font-display font-bold text-foreground">
          {sellerName}&apos;s Listings
        </h2>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="listings-sort" className="text-xs text-muted-foreground hidden sm:block">Sort by:</label>
          <select
            id="listings-sort"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortKey) }}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
          >
            {sortOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border" role="tablist">
        {tabs.map((tab) => {
          const count = tabCounts[tab.key]
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => { setActiveTab(tab.key) }}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors relative',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-1.5 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {String(count)}
              </span>
              {isActive && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      {/* Listings grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              {...listing}
              listingType={getListingType(listing)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {activeTab === 'all'
              ? 'No listings available.'
              : `No listings available for ${tabs.find((t) => t.key === activeTab)?.label ?? ''}.`
            }
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-primary hover:text-primary/80 transition-colors">
            Browse marketplace
          </Link>
        </div>
      )}
    </section>
  )
}

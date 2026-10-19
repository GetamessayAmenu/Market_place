"use client"
import { Pagination, cn } from '@marketplace/ui'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'

import ListingCard, { type ListingCardProps, type ListingType } from './ListingCard'

export interface SellerListing extends ListingCardProps {
  availableForPurchase?: boolean | undefined
  availableForRent?: boolean | undefined
  customOrderAvailable?: boolean | undefined
  rentalPricePerDay?: number | null | undefined
  startingCustomPrice?: number | null | undefined
  supportsReadyMade?: boolean | undefined
  supportsCustomDesign?: boolean | undefined
  primaryImageUrl?: string | null | undefined
  city?: string | null | undefined
  createdAt: string
}

export interface SellerListingCounts {
  all: number
  buy: number
  rent: number
  custom: number
}

export interface SellerListingsProps {
  listings: SellerListing[]
  sellerName: string
  sellerLocation?: string | null | undefined
  sellerRating?: number | string | null | undefined
  isVerified?: boolean | undefined
  counts?: SellerListingCounts | undefined
  className?: string | undefined
}

type TabKey = 'all' | 'buy' | 'rent' | 'custom'
type SortKey = 'newest' | 'price-asc' | 'price-desc'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
]

const PAGE_SIZE = 12

export default function SellerListings({
  listings,
  sellerName,
  sellerLocation,
  sellerRating,
  isVerified,
  counts,
  className,
}: SellerListingsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Real listing counts (from backend or calculated accurately from real listing records)
  const tabCounts = useMemo<SellerListingCounts>(() => {
    if (counts) {
      return counts
    }
    return {
      all: listings.length,
      buy: listings.filter((l) => l.availableForPurchase !== false).length,
      rent: listings.filter((l) => Boolean(l.availableForRent)).length,
      custom: listings.filter((l) => Boolean(l.customOrderAvailable || l.supportsCustomDesign)).length,
    }
  }, [counts, listings])

  // Only show tabs that actually have results (requirement 6)
  const availableTabs = useMemo(() => {
    const list: { key: TabKey; label: string; count: number }[] = [
      { key: 'all', label: 'All', count: tabCounts.all },
    ]
    if (tabCounts.buy > 0) {
      list.push({ key: 'buy', label: 'For Sale', count: tabCounts.buy })
    }
    if (tabCounts.rent > 0) {
      list.push({ key: 'rent', label: 'Rentals', count: tabCounts.rent })
    }
    if (tabCounts.custom > 0) {
      list.push({ key: 'custom', label: 'Custom', count: tabCounts.custom })
    }
    return list
  }, [tabCounts])

  // Fallback if current activeTab was filtered out
  const currentTab = availableTabs.some((t) => t.key === activeTab) ? activeTab : 'all'

  // Filter listings based on active tab
  const filtered = useMemo(() => {
    let items = listings

    if (currentTab === 'buy') {
      items = items.filter((l) => l.availableForPurchase !== false)
    } else if (currentTab === 'rent') {
      items = items.filter((l) => Boolean(l.availableForRent))
    } else if (currentTab === 'custom') {
      items = items.filter((l) => Boolean(l.customOrderAvailable || l.supportsCustomDesign))
    }

    if (sortBy === 'price-asc') {
      items = [...items].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      items = [...items].sort((a, b) => b.price - a.price)
    } else {
      items = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return items
  }, [listings, currentTab, sortBy])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key)
    setCurrentPage(1)
  }

  const handleSortChange = (key: SortKey) => {
    setSortBy(key)
    setCurrentPage(1)
  }

  return (
    <section className={cn('space-y-6', className)} aria-labelledby="seller-listings-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="seller-listings-heading" className="text-xl font-display font-bold text-foreground">
            {sellerName}&apos;s Listings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tabCounts.all} {tabCounts.all === 1 ? 'item available' : 'items available'}
          </p>
        </div>

        {/* Sort dropdown */}
        {listings.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor="listings-sort" className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</label>
            <select
              id="listings-sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortKey)}
              className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 cursor-pointer shadow-xs"
            >
              {sortOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs - Only render if multiple tabs exist */}
      {availableTabs.length > 1 && (
        <div className="flex gap-2 border-b border-border overflow-x-auto pb-px" role="tablist">
          {availableTabs.map((tab) => {
            const isActive = currentTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span className={cn(
                  'ml-1.5 rounded-full px-2 py-0.5 text-xs',
                  isActive ? 'bg-primary/10 text-primary font-bold' : 'bg-muted text-muted-foreground'
                )}>
                  {String(tab.count)}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Listings grid */}
      {paginatedListings.length > 0 ? (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                currency={(listing.currency as any) || 'ETB'}
                imageUrl={listing.imageUrl || listing.primaryImageUrl}
                designerName={sellerName}
                location={listing.location || listing.city || sellerLocation || undefined}
                verifiedSeller={isVerified}
                rating={listing.rating ?? sellerRating ?? undefined}
                supportsReadyMade={listing.supportsReadyMade ?? listing.availableForPurchase ?? true}
                availableForRent={listing.availableForRent}
                rentalPricePerDay={listing.rentalPricePerDay}
                customOrderAvailable={listing.customOrderAvailable}
                supportsCustomDesign={listing.supportsCustomDesign}
                startingCustomPrice={listing.startingCustomPrice}
                activeMode={currentTab === 'all' ? undefined : (currentTab as ListingType)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          {listings.length === 0 ? (
            <>
              <h3 className="text-base font-semibold text-foreground">No listings yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {sellerName} doesn&apos;t have any active listings at the moment.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Browse marketplace →
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-foreground">No matching listings</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No listings found for this category.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                View all listings ({tabCounts.all})
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}

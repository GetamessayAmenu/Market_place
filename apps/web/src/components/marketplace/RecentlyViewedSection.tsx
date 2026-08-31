"use client"

import React, { useEffect, useState } from 'react'
import ListingCard from './ListingCard'

interface RecentlyViewedItem {
  id: string
  title: string
  price: number
  imageUrl?: string | null
  city?: string | null
  listingType?: 'buy' | 'rent' | 'custom'
  availableForRent?: boolean
  rentalPricePerDay?: number | null
}

export default function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('recently_viewed_listings')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setItems(parsed.slice(0, 5))
        }
      }
    } catch {
      // Graceful error fallback
    }
  }, [])

  if (!mounted || items.length === 0) {
    return null
  }

  return (
    <section className="py-12 border-t" aria-labelledby="recently-viewed-heading">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 id="recently-viewed-heading" className="font-display text-2xl font-bold text-foreground">
            Recently Viewed
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Pick up where you left off</p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('recently_viewed_listings')
            setItems([])
          }}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear history
        </button>
      </div>

      <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((listing) => (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            price={listing.price}
            {...(listing.city ? { location: listing.city } : {})}
            {...(listing.availableForRent !== undefined ? { availableForRent: listing.availableForRent } : {})}
            {...(listing.rentalPricePerDay ? { rentalPricePerDay: listing.rentalPricePerDay } : {})}
            {...(listing.imageUrl ? { imageUrl: listing.imageUrl } : {})}
            {...(listing.listingType ? { listingType: listing.listingType } : {})}
          />
        ))}
      </div>
    </section>
  )
}


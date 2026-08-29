"use client"

import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import SearchBar from './SearchBar'

export interface HeroBannerData {
  id: string
  title: string
  subtitle?: string | null
  imageUrl: string
  linkUrl?: string | null
}

interface HeroSearchProps {
  banners?: HeroBannerData[]
}

export default function HeroSearch({ banners = [] }: HeroSearchProps) {
  const router = useRouter()
  const [activeBannerIdx, setActiveBannerIdx] = useState(0)
  const currentBanner = banners[activeBannerIdx]

  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      router.push(`/search?${params.toString()}`)
    },
    [router]
  )

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-brand-gold/5 to-brand-wine/5 py-16 md:py-24">
      {/* Background Banner Image if available */}
      {currentBanner?.imageUrl && (
        <div className="absolute inset-0 z-0">
          <img src={currentBanner.imageUrl} alt={currentBanner.title} className="h-full w-full object-cover opacity-20 dark:opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
        {currentBanner ? (
          <>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              Special Collection
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {currentBanner.title}
            </h1>
            {currentBanner.subtitle && (
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {currentBanner.subtitle}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Ethiopian Fashion Marketplace
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Buy, rent, or order custom-made fashion from talented Ethiopian designers.
              Discover traditional and modern styles.
            </p>
          </>
        )}

        <div className="mt-8 max-w-xl mx-auto">
          <SearchBar
            placeholder="Search Habesha Kemis, suits, accessories..."
            onSearch={handleSearch}
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {currentBanner?.linkUrl ? (
            <button
              type="button"
              onClick={() => { router.push(currentBanner.linkUrl!) }}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
            >
              Explore Collection &rarr;
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => { router.push('/search?type=buy') }}
            className="rounded-full bg-green-600/10 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 transition-colors hover:bg-green-600/20"
          >
            Buy Fashion
          </button>
          <button
            type="button"
            onClick={() => { router.push('/search?type=rent') }}
            className="rounded-full bg-brand-gold/10 px-4 py-2 text-sm font-medium text-brand-gold transition-colors hover:bg-brand-gold/20"
          >
            Rent Outfits
          </button>
          <button
            type="button"
            onClick={() => { router.push('/search?type=custom') }}
            className="rounded-full bg-brand-wine/10 px-4 py-2 text-sm font-medium text-brand-wine transition-colors hover:bg-brand-wine/20"
          >
            Custom Orders
          </button>
        </div>

        {/* Carousel indicators if multiple banners */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBannerIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeBannerIdx ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/40'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

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

const POPULAR_SEARCH_TAGS = [
  'Habesha Kemis',
  'Bridal Wear',
  'Zuria',
  'Netela',
  'Men Suits',
  'Wedding Dress',
  'Addis Ababa',
]

export default function HeroSearch({ banners = [] }: HeroSearchProps) {
  const router = useRouter()
  const [activeMode, setActiveMode] = useState<'buy' | 'rent' | 'custom'>('buy')
  const [activeBannerIdx, setActiveBannerIdx] = useState(0)
  const currentBanner = banners[activeBannerIdx]

  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (activeMode !== 'buy') params.set('type', activeMode)
      router.push(`/search?${params.toString()}`)
    },
    [router, activeMode]
  )

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams()
    params.set('q', tag)
    if (activeMode !== 'buy') params.set('type', activeMode)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-gold/10 via-background to-brand-wine/10 py-16 md:py-24 border-b">
      {/* Background Banner Image if available */}
      {currentBanner?.imageUrl ? (
        <div className="absolute inset-0 z-0">
          <img src={currentBanner.imageUrl} alt={currentBanner.title} className="h-full w-full object-cover opacity-20 dark:opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.15),rgba(255,255,255,0))]" />
      )}

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-gold border border-brand-gold/20 mb-4 shadow-2xs">
          ✨ Premier Ethiopian Marketplace
        </span>

        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-tight">
          Discover Ethiopian Fashion
        </h1>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal">
          Buy ready-to-wear outfits, rent for special celebrations, or get custom-made garments handcrafted by verified Ethiopian designers.
        </p>

        {/* Mode Selector Tabs */}
        <div className="mt-8 inline-flex items-center rounded-xl bg-background/80 backdrop-blur-md p-1 border shadow-xs">
          <button
            type="button"
            onClick={() => setActiveMode('buy')}
            className={`rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'buy'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Shop
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('rent')}
            className={`rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'rent'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rent
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('custom')}
            className={`rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'custom'
                ? 'bg-brand-wine text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Custom Order
          </button>
        </div>

        {/* Large prominent search bar */}
        <div className="mt-6 max-w-2xl mx-auto shadow-lg rounded-xl">
          <SearchBar
            variant="hero"
            placeholder="Search Habesha Kemis, bridal wear, Netela..."
            onSearch={handleSearch}
          />
        </div>

        {/* Popular Searches below search bar */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground/80">Popular:</span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="rounded-full bg-card hover:bg-muted border px-3 py-1 text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Banner carousel indicator if multiple */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBannerIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeBannerIdx ? 'w-8 bg-brand-gold' : 'w-2 bg-muted-foreground/40'
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


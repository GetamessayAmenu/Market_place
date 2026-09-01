"use client"

import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import SearchBar from './SearchBar'

export interface HeroBannerData {
  id: string
  title: string
  subtitle?: string | null
  imageUrl: string
  linkUrl?: string | null
  sortOrder?: number
  holidayTheme?: string | null
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
  const [activeMode, setActiveMode] = useState<'' | 'buy' | 'rent' | 'custom'>('')
  const [activeBannerIdx, setActiveBannerIdx] = useState(0)

  // Ensure active index stays within bounds
  useEffect(() => {
    if (activeBannerIdx >= banners.length && banners.length > 0) {
      setActiveBannerIdx(0)
    }
  }, [banners.length, activeBannerIdx])

  // Auto-carousel rotator (switches slide every 6 seconds)
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [banners.length])

  const handlePrevSlide = () => {
    if (banners.length <= 1) return
    setActiveBannerIdx((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNextSlide = () => {
    if (banners.length <= 1) return
    setActiveBannerIdx((prev) => (prev + 1) % banners.length)
  }

  const currentBanner = banners[activeBannerIdx]

  const handleSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (activeMode) params.set('type', activeMode)
      router.push(`/search?${params.toString()}`)
    },
    [router, activeMode]
  )

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams()
    params.set('q', tag)
    if (activeMode) params.set('type', activeMode)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-gold/10 via-background to-brand-wine/10 py-16 md:py-24 border-b transition-all">
      {/* Background Banner Image for Active Slide */}
      {currentBanner?.imageUrl ? (
        <div className="absolute inset-0 z-0 transition-all duration-700">
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title || 'Hero Banner Image'}
            className="h-full w-full object-cover object-center opacity-25 dark:opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.15),rgba(255,255,255,0))]" />
      )}

      {/* Slider Previous / Next Arrow Controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-md text-foreground border shadow-md hover:bg-background hover:scale-110 transition-all font-bold text-xl cursor-pointer"
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-md text-foreground border shadow-md hover:bg-background hover:scale-110 transition-all font-bold text-xl cursor-pointer"
          >
            &#8250;
          </button>
        </>
      )}

      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-gold border border-brand-gold/20 mb-4 shadow-2xs">
          ✨ Premier Ethiopian Marketplace
        </span>

        <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-tight">
          {currentBanner?.title || 'Discover Ethiopian Fashion'}
        </h1>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal">
          {currentBanner?.subtitle || 'Buy ready-to-wear outfits, rent for special celebrations, or get custom-made garments handcrafted by verified Ethiopian designers.'}
        </p>

        {currentBanner?.linkUrl && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => { router.push(currentBanner.linkUrl!) }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-md hover:scale-105"
            >
              Explore Collection &rarr;
            </button>
          </div>
        )}

        {/* Slide Indicator Dots + Counter */}
        {banners.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {String(activeBannerIdx + 1)} / {String(banners.length)}
            </span>
            <div className="flex items-center gap-1.5">
              {banners.map((b, idx) => (
                <button
                  key={b.id || idx}
                  type="button"
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === activeBannerIdx ? 'w-8 bg-brand-gold' : 'w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground'
                  }`}
                  aria-label={`Go to slide ${String(idx + 1)}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="mt-8 inline-flex items-center rounded-xl bg-background/80 backdrop-blur-md p-1 border shadow-xs">
          <button
            type="button"
            onClick={() => setActiveMode('')}
            className={`rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeMode === ''
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('buy')}
            className={`rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'buy'
                ? 'bg-emerald-600 text-white shadow-xs'
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
            onSearch={handleSearch}
            placeholder="Search Habesha Kemis, bridal wear, Netela..."
          />
        </div>

        {/* Popular Tags */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Popular:</span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="rounded-full bg-background/60 hover:bg-background px-3 py-1 text-xs border transition-colors shadow-2xs hover:text-brand-gold font-medium cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Active Promotional Banners Showcase Cards (if multiple published banners exist) */}
        {banners.length > 1 && (
          <div className="mt-12 text-left border-t border-border/40 pt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">
              Active Promotional Highlights ({String(banners.length)} Featured)
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {banners.map((b, idx) => (
                <div
                  key={b.id || idx}
                  onClick={() => {
                    setActiveBannerIdx(idx)
                    if (b.linkUrl) router.push(b.linkUrl)
                  }}
                  className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 cursor-pointer ${
                    idx === activeBannerIdx
                      ? 'border-brand-gold bg-brand-gold/10 shadow-md ring-1 ring-brand-gold/50'
                      : 'border-border bg-card/60 hover:border-brand-gold/50 hover:bg-card hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {b.title}
                        </h3>
                        {idx === activeBannerIdx && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold bg-brand-gold/15 px-2 py-0.5 rounded-full flex-shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      {b.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{b.subtitle}</p>
                      )}
                      {b.linkUrl && (
                        <span className="mt-1 inline-block text-[11px] font-semibold text-primary group-hover:underline">
                          View Offer &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

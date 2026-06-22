"use client"

import { useRouter } from 'next/navigation'
import React, { useCallback } from 'react'

import SearchBar from './SearchBar'

export default function HeroSearch() {
  const router = useRouter()

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
      <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Ethiopian Fashion Marketplace
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Buy, rent, or order custom-made fashion from talented Ethiopian designers.
          Discover traditional and modern styles.
        </p>
        <div className="mt-8 max-w-xl mx-auto">
          <SearchBar
            placeholder="Search Habesha Kemis, suits, accessories..."
            onSearch={handleSearch}
          />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => { router.push('/search?type=buy') }}
            className="rounded-full bg-green-600/10 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-600/20"
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
      </div>
    </section>
  )
}

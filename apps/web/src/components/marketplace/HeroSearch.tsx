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
    <section className="bg-primary/5 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Find great local deals
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Buy and sell with confidence. Browse thousands of listings in your area.
        </p>
        <div className="mt-8 max-w-xl mx-auto">
          <SearchBar
            placeholder="Search for anything..."
            onSearch={handleSearch}
          />
        </div>
      </div>
    </section>
  )
}

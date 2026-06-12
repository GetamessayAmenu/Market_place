import React, { Suspense } from 'react'

import SearchClient from '../../components/marketplace/SearchClient'

export function generateMetadata() {
  return {
    title: 'Search Listings — Marketplace',
    description: 'Search and browse marketplace listings. Filter by category, price, condition, and location.',
  }
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse bg-muted h-11 rounded-lg mb-6" aria-hidden="true" />
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card shadow-sm" aria-hidden="true">
                <div className="animate-pulse bg-muted aspect-[4/3] rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <div className="animate-pulse bg-muted h-4 w-3/4 rounded" />
                  <div className="animate-pulse bg-muted h-5 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  )
}

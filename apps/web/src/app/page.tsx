import Link from 'next/link'
import React from 'react'

import Container from '../components/Container'
import CategoryCard from '../components/marketplace/CategoryCard'
import HeroSearch from '../components/marketplace/HeroSearch'
import ListingCard from '../components/marketplace/ListingCard'
import { serverGet } from '../lib/serverApi'

interface ListingData {
  id: string
  title: string
  price: number
  condition: string
  city: string
  primaryImageUrl?: string | null
  isFeatured?: boolean
}

interface CategoryData {
  id: string
  name: string
  slug: string
  imageUrl?: string | null
  parentId?: string | null
  _count?: { listings: number }
  children?: CategoryData[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: { total: number; page: number; limit: number; totalPages: number }
}

export function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return {
    title: 'Marketplace — Buy and Sell Locally',
    description: 'Find great local deals. Buy and sell with confidence on our marketplace.',
    openGraph: {
      title: 'Marketplace — Buy and Sell Locally',
      description: 'Find great local deals. Buy and sell with confidence on our marketplace.',
      url: siteUrl,
      siteName: 'Marketplace',
      type: 'website',
    },
  }
}

export default async function HomePage() {
  let featuredListings: ListingData[] = []
  let recentListings: ListingData[] = []
  let categories: CategoryData[] = []

  try {
    const [featuredRes, recentRes, categoriesRes] = await Promise.allSettled([
      serverGet<ApiResponse<ListingData[]>>('/listings', {
        revalidate: 60,
        params: { featured: 'true', limit: 8 },
      }),
      serverGet<ApiResponse<ListingData[]>>('/listings', {
        revalidate: 60,
        params: { sortBy: 'newest', limit: 12 },
      }),
      serverGet<ApiResponse<CategoryData[]>>('/categories', { revalidate: 120 }),
    ])

    if (featuredRes.status === 'fulfilled') {
      featuredListings = featuredRes.value.data
    }
    if (recentRes.status === 'fulfilled') {
      recentListings = recentRes.value.data
    }
    if (categoriesRes.status === 'fulfilled') {
      // Filter to top-level categories for the grid
      const allCats = categoriesRes.value.data
      categories = allCats.filter((c) => !c.parentId)
    }
  } catch {
    // Graceful fallback — show empty state sections
  }

  return (
    <>
      <HeroSearch />

      <Container>
        {/* Featured Listings */}
        {featuredListings.length > 0 && (
          <section className="py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Featured Listings</h2>
              <Link
                href="/search?featured=true"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {featuredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  {...(listing.primaryImageUrl !== undefined && { imageUrl: listing.primaryImageUrl })}
                  city={listing.city}
                  condition={listing.condition}
                />
              ))}
            </div>
          </section>
        )}

        {/* Categories Grid */}
        {categories.length > 0 && (
          <section className="py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Browse Categories</h2>
              <Link
                href="/search"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Browse all
              </Link>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard
                  key={cat.id}
                  slug={cat.slug}
                  name={cat.name}
                  {...(cat.imageUrl !== undefined && { imageUrl: cat.imageUrl })}
                  {...(cat._count?.listings !== undefined && { listingCount: cat._count.listings })}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Listings */}
        <section className="py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Listings</h2>
            <Link
              href="/search?sortBy=newest"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all
            </Link>
          </div>
          {recentListings.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {recentListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  {...(listing.primaryImageUrl !== undefined && { imageUrl: listing.primaryImageUrl })}
                  city={listing.city}
                  condition={listing.condition}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-muted-foreground">No listings available yet.</p>
              <Link
                href="/search"
                className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80"
              >
                Browse all listings
              </Link>
            </div>
          )}
        </section>
      </Container>
    </>
  )
}

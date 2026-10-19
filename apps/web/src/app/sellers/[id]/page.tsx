import { cn } from '@marketplace/ui'
import Link from 'next/link'
import React from 'react'

import Container from '../../../components/Container'
import BreadcrumbNav from '../../../components/marketplace/BreadcrumbNav'
import ReviewSection from '../../../components/marketplace/ReviewSection'
import SellerAbout, { type SocialLinks } from '../../../components/marketplace/SellerAbout'
import SellerContact from '../../../components/marketplace/SellerContact'
import SellerCover, { type SellerType } from '../../../components/marketplace/SellerCover'
import SellerListings, { type SellerListing } from '../../../components/marketplace/SellerListings'
import SellerProfileCard from '../../../components/marketplace/SellerProfileCard'
import SellerStats, { type SellerStatsData } from '../../../components/marketplace/SellerStats'
import ShopLocationMap from '../../../components/marketplace/ShopLocationMap'
import TrustBadges from '../../../components/marketplace/TrustBadges'
import { serverGet } from '../../../lib/serverApi'

interface SellerData {
  id: string
  displayName: string
  email?: string
  phone?: string | null
  bio?: string | null
  location?: string | null
  avatarUrl?: string | null
  sellerType?: string | null
  coverImageUrl?: string | null
  specialties?: string[]
  socialLinks?: SocialLinks | null
  responseRate?: number | null
  responseTimeHours?: number | null
  totalSales?: number | null
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
  rating?: number | null
  reviewCount?: number
  isVerified?: boolean
  followerCount?: number
  listingCounts?: {
    all: number
    buy: number
    rent: number
    custom: number
  }
  _count?: {
    listings?: number
    storeFollowers?: number
    followers?: number
  }
}

interface ListingRaw {
  id: string
  title: string
  price: number
  currency?: string
  condition?: string
  city?: string
  location?: string
  primaryImageUrl?: string | null
  availableForPurchase?: boolean
  availableForRent?: boolean
  rentalPricePerDay?: number | null
  customOrderAvailable?: boolean
  startingCustomPrice?: number | null
  supportsReadyMade?: boolean
  supportsCustomDesign?: boolean
  rating?: number | string | null
  reviewCount?: number
  createdAt: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  counts?: {
    all: number
    buy: number
    rent: number
    custom: number
  }
}

interface Props {
  params: { id: string }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: Props) {
  try {
    const res = await serverGet<SellerData>(`/users/${params.id}`, {
      revalidate: 120,
    })
    const u = res
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    return {
      title: `${u.displayName} — Marketplace`,
      description: u.bio?.slice(0, 160) ?? `View ${u.displayName}'s profile and listings on Habesha Fashion Marketplace.`,
      openGraph: {
        title: `${u.displayName} — Marketplace`,
        description: u.bio?.slice(0, 160) ?? `View ${u.displayName}'s profile and listings on Habesha Fashion Marketplace.`,
        url: `${siteUrl}/sellers/${u.id}`,
        ...(u.avatarUrl != null && { images: [u.avatarUrl] }),
        type: 'profile',
      },
    }
  } catch {
    return { title: `Seller Profile — Marketplace` }
  }
}

export default async function SellerPage({ params, searchParams: _searchParams }: Props) {
  const { id } = params

  let seller: SellerData | null = null
  let listings: ListingRaw[] = []
  let counts: { all: number; buy: number; rent: number; custom: number } | undefined = undefined

  try {
    const [sellerRes, listingsRes] = await Promise.allSettled([
      serverGet<SellerData>(`/users/${id}`, { revalidate: 120 }),
      serverGet<PaginatedResponse<ListingRaw>>(`/users/${id}/listings`, {
        revalidate: 60,
        params: { page: 1, limit: 50 },
      }),
    ])

    if (sellerRes.status === 'fulfilled') {
      seller = sellerRes.value
    } else {
      console.error('Seller fetch error:', sellerRes.reason)
    }
    if (listingsRes.status === 'fulfilled') {
      const val = listingsRes.value as any
      if (Array.isArray(val)) {
        listings = val
      } else if (Array.isArray(val?.data)) {
        listings = val.data
      } else if (Array.isArray(val?.items)) {
        listings = val.items
      } else {
        listings = []
      }
      counts = val?.counts ?? seller?.listingCounts
    } else {
      console.error('Listings fetch error:', listingsRes.reason)
    }

    // Safety fallback: if 0 listings returned, query public active listings by sellerId
    if (listings.length === 0) {
      try {
        const fallbackRes = await serverGet<any>(`/listings`, {
          revalidate: 60,
          params: { sellerId: id, limit: 50 },
        })
        if (Array.isArray(fallbackRes)) {
          listings = fallbackRes
        } else if (Array.isArray(fallbackRes?.data)) {
          listings = fallbackRes.data
        } else if (Array.isArray(fallbackRes?.items)) {
          listings = fallbackRes.items
        }
      } catch (fallbackErr) {
        console.error('Listings fallback error:', fallbackErr)
      }
    }
  } catch (error) {
    console.error('Unexpected error in SellerPage:', error)
  }

  if (seller == null) {
    return (
      <Container>
        <section className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Seller Not Found</h1>
          <p className="mt-4 text-muted-foreground">The seller you are looking for does not exist or has been removed.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary/80">
            Go to homepage
          </Link>
        </section>
      </Container>
    )
  }

  const memberSince = new Date(seller.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  const sellerType = (seller.sellerType?.replace('_', '-') ?? 'designer') as SellerType

  // Real listing counts strictly aligned with backend data
  const realListingCount = counts?.all ?? seller.listingCounts?.all ?? seller._count?.listings ?? listings.length

  const stats: SellerStatsData = {
    listingCount: realListingCount,
    reviewCount: seller.reviewCount ?? 0,
    ...(seller.rating != null && { averageRating: seller.rating }),
    ...(seller.totalSales != null && { totalSales: seller.totalSales }),
    ...(seller.responseRate != null && { responseRate: seller.responseRate }),
    ...(seller.responseTimeHours != null && { responseTimeHours: seller.responseTimeHours }),
  }

  const sellerListings: SellerListing[] = listings.map((l) => {
    const imgUrl = l.primaryImageUrl || (l as any).images?.[0]?.url || (l as any).imageUrl || undefined
    const locationStr = l.location || l.city || undefined
    return {
      id: l.id,
      title: l.title,
      price: Number(l.price),
      currency: (l.currency as any) || 'ETB',
      createdAt: l.createdAt,
      ...(imgUrl !== undefined && { imageUrl: imgUrl, primaryImageUrl: imgUrl }),
      ...(l.city !== undefined && { city: l.city }),
      ...(locationStr !== undefined && { location: locationStr }),
      ...(l.availableForPurchase !== undefined && { availableForPurchase: l.availableForPurchase }),
      ...(l.availableForRent !== undefined && { availableForRent: l.availableForRent }),
      ...(l.rentalPricePerDay !== undefined && { rentalPricePerDay: l.rentalPricePerDay }),
      ...(l.customOrderAvailable !== undefined && { customOrderAvailable: l.customOrderAvailable }),
      ...(l.startingCustomPrice !== undefined && { startingCustomPrice: l.startingCustomPrice }),
      ...(l.supportsReadyMade !== undefined && { supportsReadyMade: l.supportsReadyMade }),
      ...(l.supportsCustomDesign !== undefined && { supportsCustomDesign: l.supportsCustomDesign }),
      ...(l.rating !== undefined && { rating: l.rating }),
      ...(l.reviewCount !== undefined && { reviewCount: l.reviewCount }),
    }
  })

  const fastResponder = (seller.responseTimeHours ?? Infinity) <= 2
  const topRated = stats.totalSales != null && stats.totalSales > 10

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <Container className="pt-4 pb-2">
        <BreadcrumbNav
          items={[
            { label: 'Home', href: '/' },
            { label: 'Sellers', href: '/sellers' },
            { label: seller.displayName },
          ]}
        />
      </Container>

      {/* Cover section - full bleed */}
      <SellerCover
        {...(seller.coverImageUrl !== undefined && { coverImageUrl: seller.coverImageUrl })}
        sellerType={sellerType}
      />

      {/* Profile card - overlaps cover */}
      <SellerProfileCard
        seller={{
          ...seller,
          sellerType,
          rating: seller.rating ?? null,
          reviewCount: seller.reviewCount ?? 0,
          ...(seller.isVerified !== undefined && { isVerified: seller.isVerified }),
          _count: {
            listings: realListingCount,
            storeFollowers: seller._count?.storeFollowers ?? seller._count?.followers ?? seller.followerCount ?? 0,
          },
        }}
      />

      {/* Main content */}
      <Container className="py-10 space-y-12">
        {/* Trust indicators */}
        <TrustBadges
          emailVerified={seller.emailVerifiedAt != null}
          phoneVerified={seller.phoneVerifiedAt != null}
          topRated={topRated}
          fastResponder={fastResponder}
          memberSince={memberSince}
        />

        {/* Stats */}
        <SellerStats stats={stats} />

        {/* Divider */}
        <hr className="border-border/50" />

        <SellerListings
          listings={sellerListings}
          sellerName={seller.displayName}
          {...(seller.location !== undefined && { sellerLocation: seller.location })}
          {...(seller.rating !== undefined && { sellerRating: seller.rating })}
          {...(seller.isVerified !== undefined && { isVerified: seller.isVerified })}
          {...((counts ?? seller.listingCounts) !== undefined && { counts: counts ?? seller.listingCounts })}
        />

        {/* Divider */}
        <hr className="border-border/50" />

        {/* Reviews section */}
        <section id="reviews" aria-labelledby="seller-reviews-heading" className="scroll-mt-16">
          <h2
            id="seller-reviews-heading"
            className="text-lg font-display font-bold text-foreground mb-6"
          >
            Customer Reviews
          </h2>
          <ReviewSection listingId="" sellerId={seller.id} />
        </section>

        {/* Divider */}
        <hr className="border-border/50" />

        {/* Shop Location */}
        {seller.location != null && seller.location.length > 0 && (
          <>
            <ShopLocationMap 
              sellerName={seller.displayName}
              location={seller.location}
            />
            <hr className="border-border/50" />
          </>
        )}

        {/* Two-column: About + Contact */}
        <div className={cn('grid gap-12 lg:grid-cols-2')}>
          <SellerAbout
            {...(seller.bio !== undefined && { bio: seller.bio })}
            {...(seller.specialties !== undefined && { specialties: seller.specialties })}
            {...(seller.location !== undefined && { location: seller.location })}
            memberSince={memberSince}
            {...(seller.socialLinks !== undefined && { socialLinks: seller.socialLinks })}
          />
          <SellerContact
            sellerId={seller.id}
            sellerName={seller.displayName}
            {...(seller.phone !== undefined && { phone: seller.phone })}
            {...(seller.location !== undefined && { location: seller.location })}
          />
        </div>
      </Container>
    </div>
  )
}

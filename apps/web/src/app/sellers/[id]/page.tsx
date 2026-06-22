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
  _count?: {
    listings: number
    followers?: number
  }
}

interface ListingRaw {
  id: string
  title: string
  price: number
  condition: string
  city: string
  primaryImageUrl?: string | null
  availableForPurchase?: boolean
  availableForRent?: boolean
  customOrderAvailable?: boolean
  rentalPricePerDay?: number | null
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
      description: u.bio?.slice(0, 160) ?? `View ${u.displayName}'s profile and listings.`,
      openGraph: {
        title: `${u.displayName} — Marketplace`,
        description: u.bio?.slice(0, 160) ?? `View ${u.displayName}'s profile and listings.`,
        url: `${siteUrl}/sellers/${u.id}`,
        ...(u.avatarUrl != null && { images: [u.avatarUrl] }),
        type: 'profile',
      },
    }
  } catch {
    return { title: `Seller — Marketplace` }
  }
}

export default async function SellerPage({ params, searchParams: _searchParams }: Props) {
  const { id } = params

  let seller: SellerData | null = null
  let listings: ListingRaw[] = []

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
    }
    if (listingsRes.status === 'fulfilled') {
      listings = listingsRes.value.data
    }
  } catch {
    // Graceful fallback
  }

  if (seller == null) {
    return (
      <Container>
        <section className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Seller Not Found</h1>
          <p className="mt-4 text-muted-foreground">The seller you are looking for does not exist.</p>
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

  const stats: SellerStatsData = {
    listingCount: seller._count?.listings ?? 0,
    ...(seller.totalSales != null && { totalSales: seller.totalSales }),
    ...(seller.responseRate != null && { responseRate: seller.responseRate }),
    ...(seller.responseTimeHours != null && { responseTimeHours: seller.responseTimeHours }),
  }

  const sellerListings: SellerListing[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    createdAt: l.createdAt,
    ...(l.primaryImageUrl !== undefined && { imageUrl: l.primaryImageUrl }),
    ...(l.availableForPurchase !== undefined && { availableForPurchase: l.availableForPurchase }),
    ...(l.availableForRent !== undefined && { availableForRent: l.availableForRent }),
    ...(l.customOrderAvailable !== undefined && { customOrderAvailable: l.customOrderAvailable }),
  }))

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

        {/* Listings */}
        <SellerListings listings={sellerListings} sellerName={seller.displayName} />

        {/* Divider */}
        <hr className="border-border/50" />

        {/* Reviews section */}
        <section aria-labelledby="seller-reviews-heading">
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
            {...(seller.email !== undefined && { email: seller.email })}
            {...(seller.location !== undefined && { location: seller.location })}
          />
        </div>
      </Container>
    </div>
  )
}

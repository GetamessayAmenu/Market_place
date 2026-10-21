import { Badge } from '@marketplace/ui'
import Link from 'next/link'
import React from 'react'

import Container from '../../../components/Container'
import FavoriteButton from '../../../components/marketplace/FavoriteButton'
import ImageGallery from '../../../components/marketplace/ImageGallery'
import ListingAttributes from '../../../components/marketplace/ListingAttributes'
import MarkUnavailableButton from '../../../components/marketplace/MarkUnavailableButton'
import MoreFromSeller from '../../../components/marketplace/MoreFromSeller'
import PostSimilarAdButton from '../../../components/marketplace/PostSimilarAdButton'
import PriceHistoryButton from '../../../components/marketplace/PriceHistoryButton'
import ReportAbuseButton from '../../../components/marketplace/ReportAbuseButton'
import SafetyTips from '../../../components/marketplace/SafetyTips'
import ShareButton from '../../../components/marketplace/ShareButton'
import RevealContact from '../../../components/marketplace/RevealContact'
import YouMayAlsoLike from '../../../components/marketplace/YouMayAlsoLike'
import ContactSellerButton from '../../../components/marketplace/ContactSellerButton'
import RentButton from '../../../components/marketplace/RentButton'
import { optionalUser } from '../../../lib/authServer'
import { serverGet } from '../../../lib/serverApi'

interface ListingImage {
  url: string
  isPrimary: boolean
}

interface ListingData {
  id: string
  title: string
  slug: string
  description: string
  price: number
  currency: string
  condition: string
  city: string
  location?: string
  status: string
  isFeatured: boolean
  primaryImageUrl?: string | null
  images?: ListingImage[]
  contactOptions?: {
    showPhone?: boolean
    whatsapp?: string
    telegram?: string
    inAppMessaging?: boolean
  }
  seller?: {
    id: string
    displayName: string
    avatarUrl?: string | null
    emailVerifiedAt?: string | null
    phoneVerifiedAt?: string | null
    location?: string | null
    createdAt?: string
    responseTimeHours?: number | null
    rating?: number | null
    reviewCount?: number
  }
  category?: {
    id: string
    name: string
    slug: string
  }
  _count?: {
    favorites: number
  }
  availableForPurchase?: boolean
  availableForRent?: boolean
  customOrderAvailable?: boolean
  rentalPricePerDay?: number | null
  rentalDeposit?: number | null
  rentalThreeDayRate?: number | null
  rentalWeeklyRate?: number | null
  minRentalDurationDays?: number | null
  maxRentalDurationDays?: number | null
  rentalPickupLocation?: string | null
  rentalNotes?: string | null
  // Unified custom design fields
  supportsReadyMade?: boolean
  supportsCustomDesign?: boolean
  startingCustomPrice?: number | null
  estimatedProductionDays?: number | null
  customizationOptions?: {
    requiresMeasurements: boolean
    fabricTypes: string[]
    colors: string[]
    embroideryTypes: string[]
    customNotesAllowed: boolean
  }
  attributes?: Record<string, unknown> | null
  createdAt: string
}

interface Props {
  params: Promise<{ id: string }> | { id: string }
}

export async function generateMetadata({ params }: Props) {
  try {
    const { id } = await Promise.resolve(params)
    if (!id) return { title: 'Listing — Marketplace' }
    const res = await serverGet<ListingData>(`/listings/${id}`, {
      revalidate: 60,
    })
    const listing = res
    if (!listing?.title) return { title: 'Listing — Marketplace' }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    return {
      title: `${listing.title} — Habesha Market`,
      description: (listing.description || '').slice(0, 160),
      openGraph: {
        title: `${listing.title} — Habesha Market`,
        description: (listing.description || '').slice(0, 160),
        url: `${siteUrl}/listings/${listing.id}`,
        ...(listing.primaryImageUrl ? { images: [listing.primaryImageUrl] } : {}),
        type: 'website',
      },
      alternates: {
        canonical: `${siteUrl}/listings/${listing.id}`,
      },
    }
  } catch {
    return { title: `Listing — Habesha Market` }
  }
}

export default async function ListingPage({ params }: Props) {
  const { id } = await Promise.resolve(params)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  let listing: ListingData | null = null
  let relatedData: {
    moreFromSeller: any[]
    youMayAlsoLike: any[]
    seller: {
      id: string
      displayName: string
      avatarUrl?: string | null
    }
  } | null = null

  if (id) {
    try {
      const listingRes = await serverGet<ListingData>(`/listings/${id}`, {
        revalidate: 60,
      })
      listing = listingRes || null
    } catch {
      listing = null
    }
  }

  if (listing) {
    try {
      const relatedRes = await serverGet<{
        moreFromSeller: any[]
        youMayAlsoLike: any[]
        seller: {
          id: string
          displayName: string
          avatarUrl?: string | null
        }
      }>(`/listings/${id}/related`, {
        revalidate: 60,
      })
      relatedData = relatedRes
    } catch {
      // Graceful fallback - related sections won't show
    }
  }

  if (!listing) {
    return (
      <Container>
        <section className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Listing Not Found</h1>
          <p className="mt-4 text-muted-foreground">The listing you are looking for does not exist or has been removed.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary/80">
            Go to homepage
          </Link>
        </section>
      </Container>
    )
  }

  const galleryImages = (listing.images ?? []).map((img) => ({
    url: img.url,
    alt: `${listing.title} image`,
  }))

  const conditionVariant: Record<string, 'default' | 'secondary' | 'success' | 'info'> = {
    new: 'success',
    like_new: 'info',
    good: 'default',
    fair: 'secondary',
    poor: 'secondary',
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    ...(listing.primaryImageUrl ? { image: [listing.primaryImageUrl] } : {}),
    url: `${siteUrl}/listings/${listing.id}`,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(listing.seller ? {
      seller: {
        '@type': 'Person',
        name: listing.seller.displayName,
        url: `${siteUrl}/sellers/${listing.seller.id}`,
      },
    } : {}),
  }

  const currentUser = await optionalUser()
  const isOwner = currentUser ? currentUser.id === listing.seller?.id : false

  return (
    <Container>
      <section className="py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          {listing.category ? (
            <>
              <span className="mx-2">/</span>
              <Link href={`/categories/${listing.category.slug}`} className="hover:text-foreground transition-colors">
                {listing.category.name}
              </Link>
            </>
          ) : null}
          <span className="mx-2">/</span>
          <span className="text-foreground">{listing.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Image gallery - 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            <ImageGallery images={galleryImages} listingTitle={listing.title} />
            
            {/* Description - immediately below image */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
              <div className="prose prose-base max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">{listing.description}</div>
              
              {/* Listing Attributes */}
              <ListingAttributes
                {...(listing.customizationOptions ? { customizationOptions: listing.customizationOptions } : {})}
                {...(listing.attributes ? { attributes: listing.attributes as Record<string, unknown> } : {})}
                condition={listing.condition}
                {...(listing.category ? { category: { name: listing.category.name } } : {})}
              />
            </div>
          </div>

          {/* Listing info - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and price */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{listing.title}</h1>
                <div className="flex items-center gap-3 shrink-0">
                  <ShareButton title={listing.title} />
                  <FavoriteButton listingId={listing.id} />
                </div>
              </div>
              {/* Pricing Display: Sale & Rental independently displayed */}
              <div className="space-y-3">
                {listing.availableForPurchase !== false && (
                  <div>
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <p className="text-3xl md:text-4xl font-bold text-primary">{listing.currency}{listing.price.toLocaleString()}</p>
                      <PriceHistoryButton 
                        listingId={listing.id} 
                        currentPrice={listing.price}
                        currency={listing.currency}
                      />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      For sale
                    </span>
                  </div>
                )}

                {listing.availableForRent && listing.rentalPricePerDay != null && (
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                          Rental available
                        </div>
                        <div className="text-xl font-bold text-foreground">
                          {listing.currency}{listing.rentalPricePerDay.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-muted-foreground">/ day</span>
                        </div>
                      </div>
                      <RentButton
                        listing={{
                          ...listing,
                          rentalPickupLocation: listing.rentalPickupLocation || listing.location || listing.city,
                          rentalNotes: listing.rentalNotes,
                        }}
                        isOwner={isOwner}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        Min: {listing.minRentalDurationDays ?? 1} day{(listing.minRentalDurationDays ?? 1) > 1 ? 's' : ''}
                      </span>
                      {listing.rentalDeposit != null && listing.rentalDeposit > 0 && (
                        <span>Deposit: {listing.currency}{listing.rentalDeposit.toLocaleString()}</span>
                      )}
                      {(listing.rentalPickupLocation || listing.city) && (
                        <span>Pickup: {listing.rentalPickupLocation || listing.city}</span>
                      )}
                    </div>
                    {(listing.rentalThreeDayRate || listing.rentalWeeklyRate) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {listing.rentalThreeDayRate != null && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/20">
                            🎉 3-Day Event Deal: {listing.currency}{Number(listing.rentalThreeDayRate).toLocaleString()}
                          </span>
                        )}
                        {listing.rentalWeeklyRate != null && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                            🌟 Weekly Deal: {listing.currency}{Number(listing.rentalWeeklyRate).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {listing.condition ? (
                <Badge variant={conditionVariant[listing.condition] ?? 'default'}>
                  {listing.condition.replace('_', ' ')}
                </Badge>
              ) : null}
              {listing.isFeatured ? <Badge variant="warning">Featured</Badge> : null}
              {listing.status ? <Badge variant="info">{listing.status}</Badge> : null}
            </div>

            {/* Combined Card - Contact, Location, Seller Info (Jiji-style compact) */}
            {listing.seller && (
              <div className="rounded-xl border bg-card p-4 space-y-4 sticky top-4 shadow-sm">
                {/* Seller Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/sellers/${listing.seller.id}`} className="shrink-0">
                      {listing.seller.avatarUrl ? (
                        <img 
                          src={listing.seller.avatarUrl} 
                          alt={listing.seller.displayName}
                          className="h-10 w-10 rounded-full object-cover transition-opacity hover:opacity-80"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center transition-opacity hover:opacity-80">
                          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div>
                      <Link 
                        href={`/sellers/${listing.seller.id}`}
                        className="font-semibold text-foreground hover:underline"
                      >
                        {listing.seller.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {listing.seller.createdAt 
                          ? `Member since ${new Date(listing.seller.createdAt).getFullYear()}`
                          : 'Member on marketplace'}
                      </p>
                    </div>
                  </div>
                  {listing.seller.responseTimeHours != null && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {listing.seller.responseTimeHours <= 1
                        ? 'Typically replies within an hour'
                        : `Typically replies within ${listing.seller.responseTimeHours}h`}
                    </p>
                  )}
                </div>

                {/* Phone - Reveal Contact */}
                <RevealContact phoneNumber={listing.contactOptions?.whatsapp} />

                {/* Chat Button */}
                <ContactSellerButton
                  sellerId={listing.seller.id}
                  listingId={listing.id}
                  isOwner={isOwner}
                />
              </div>
            )}

            {/* Feedback Section */}
            {listing.seller && (
              <div className="rounded-xl border bg-card p-4">
                <Link 
                  href={`/sellers/${listing.seller.id}#reviews`}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {listing.seller.reviewCount != null && listing.seller.reviewCount > 0
                        ? `${listing.seller.reviewCount} ${listing.seller.reviewCount === 1 ? 'Review' : 'Reviews'}`
                        : 'Seller Reviews'}
                    </span>
                  </div>
                  <span className="text-sm text-primary hover:text-primary/80 font-medium">View all</span>
                </Link>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <ReportAbuseButton 
                listingId={listing.id}
                listingTitle={listing.title}
              />
              <MarkUnavailableButton 
                listingId={listing.id}
                listingTitle={listing.title}
                isOwner={isOwner}
              />
            </div>

            {/* Safety Tips */}
            <SafetyTips />
          </div>
        </div>

        {/* Related Products */}
        {relatedData && relatedData.moreFromSeller && relatedData.moreFromSeller.length > 0 && (
          <div className="mt-12 space-y-8">
            {/* More from this seller */}
            <MoreFromSeller
              listings={relatedData.moreFromSeller}
              seller={relatedData.seller}
            />

            {/* You may also like */}
            {relatedData.youMayAlsoLike && relatedData.youMayAlsoLike.length > 0 && (
              <YouMayAlsoLike listings={relatedData.youMayAlsoLike} />
            )}
          </div>
        )}

        {/* Post Similar Ad CTA */}
        <section className="mt-12" aria-labelledby="post-ad-heading">
          <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
            <h2 id="post-ad-heading" className="text-2xl font-bold text-foreground mb-2">
              Have something similar to sell?
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your listing in minutes and reach thousands of buyers
            </p>
            <PostSimilarAdButton categorySlug={listing.category?.slug} className="w-full sm:w-auto" />
          </div>
        </section>

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </section>
    </Container>
  )
}

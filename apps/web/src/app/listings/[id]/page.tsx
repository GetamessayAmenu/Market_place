import { Badge } from '@marketplace/ui'
import Link from 'next/link'
import React from 'react'

import Container from '../../../components/Container'
import ChatButton from '../../../components/marketplace/ChatButton'
import FavoriteButton from '../../../components/marketplace/FavoriteButton'
import ImageGallery from '../../../components/marketplace/ImageGallery'
import ListingActions from '../../../components/marketplace/ListingActions'
import ListingCard from '../../../components/marketplace/ListingCard'
import MarkUnavailableButton from '../../../components/marketplace/MarkUnavailableButton'
import PostSimilarAdButton from '../../../components/marketplace/PostSimilarAdButton'
import PriceHistoryButton from '../../../components/marketplace/PriceHistoryButton'
import ReportAbuseButton from '../../../components/marketplace/ReportAbuseButton'
import RequestCallbackButton from '../../../components/marketplace/RequestCallbackButton'
import ReviewSection from '../../../components/marketplace/ReviewSection'
import SafetyTips from '../../../components/marketplace/SafetyTips'
import SellerInfoCard from '../../../components/marketplace/SellerInfoCard'
import ShareButton from '../../../components/marketplace/ShareButton'
import ShopLocationMap from '../../../components/marketplace/ShopLocationMap'
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
  createdAt: string
}

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  try {
    const res = await serverGet<ListingData>(`/listings/${params.id}`, {
      revalidate: 60,
    })
    const listing = res
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    return {
      title: `${listing.title} — Marketplace`,
      description: listing.description.slice(0, 160),
      openGraph: {
        title: `${listing.title} — Marketplace`,
        description: listing.description.slice(0, 160),
        url: `${siteUrl}/listings/${listing.id}`,
        ...(listing.primaryImageUrl ? { images: [listing.primaryImageUrl] } : {}),
        type: 'website',
      },
      alternates: {
        canonical: `${siteUrl}/listings/${listing.id}`,
      },
    }
  } catch {
    return { title: `Listing — Marketplace` }
  }
}

export default async function ListingPage({ params }: Props) {
  const { id } = params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  let listing: ListingData | null = null
  let relatedListings: { id: string; title: string; price: number; condition: string; city: string; primaryImageUrl?: string | null }[] = []

  try {
    const listingRes = await serverGet<ListingData>(`/listings/${id}`, {
      revalidate: 60,
    })
    listing = listingRes
  } catch {
    listing = null
  }

  if (listing?.category?.id) {
    try {
      const relatedRes = await serverGet<typeof relatedListings>('/listings', {
        revalidate: 60,
        params: { categoryId: listing.category.id, limit: 4 },
      })
      relatedListings = relatedRes.filter((l) => l.id !== listing.id)
    } catch {
      // Graceful fallback
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

  const hasActions = (listing.availableForPurchase ?? false) || (listing.availableForRent ?? false) || (listing.customOrderAvailable ?? false)

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
          <div className="lg:col-span-3">
            <ImageGallery images={galleryImages} />
          </div>

          {/* Listing info - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and price */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
                <div className="flex items-center gap-2">
                  <ShareButton title={listing.title} />
                  <FavoriteButton listingId={listing.id} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                <p className="text-3xl font-bold text-primary">{listing.currency}{listing.price.toLocaleString()}</p>
                <PriceHistoryButton 
                  listingId={listing.id} 
                  currentPrice={listing.price}
                  currency={listing.currency}
                />
              </div>
              {listing.availableForRent && listing.rentalPricePerDay != null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  or rent for {listing.currency}{listing.rentalPricePerDay.toLocaleString()}/day
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {listing.condition ? (
                <Badge variant={conditionVariant[listing.condition] ?? 'default'}>
                  {listing.condition.replace('_', ' ')}
                </Badge>
              ) : null}
              {listing.isFeatured ? <Badge variant="warning">Featured</Badge> : null}
              {listing.status ? <Badge variant="info">{listing.status}</Badge> : null}
            </div>

            {/* Buy / Rent / Custom Order actions */}
            {hasActions && listing.seller && (
              <ListingActions
                listingId={listing.id}
                price={listing.price}
                currency={listing.currency}
                availableForPurchase={listing.availableForPurchase ?? false}
                availableForRent={listing.availableForRent ?? false}
                customOrderAvailable={listing.customOrderAvailable ?? false}
                {...(listing.rentalPricePerDay !== undefined ? { rentalPricePerDay: listing.rentalPricePerDay ?? null } : { rentalPricePerDay: null })}
                {...(listing.rentalDeposit !== undefined ? { rentalDeposit: listing.rentalDeposit ?? null } : { rentalDeposit: null })}
                sellerId={listing.seller.id}
                supportsReadyMade={listing.supportsReadyMade ?? true}
                supportsCustomDesign={listing.supportsCustomDesign ?? false}
                {...(listing.startingCustomPrice !== undefined ? { startingCustomPrice: listing.startingCustomPrice } : {})}
                {...(listing.estimatedProductionDays !== undefined ? { estimatedProductionDays: listing.estimatedProductionDays } : {})}
                {...(listing.customizationOptions !== undefined ? { customizationOptions: listing.customizationOptions } : {})}
              />
            )}

            {/* Request Callback */}
            {listing.seller && (
              <RequestCallbackButton 
                listingId={listing.id}
                sellerId={listing.seller.id}
                listingTitle={listing.title}
              />
            )}

            {/* Location and date */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {listing.city ? (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{listing.location ?? listing.city}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Posted {new Date(listing.createdAt).toLocaleDateString()}</span>
              </div>
              {listing._count?.favorites !== undefined ? (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{String(listing._count.favorites)} saved</span>
                </div>
              ) : null}
            </div>

            {/* Contact actions */}
            {listing.contactOptions ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Contact Seller</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.contactOptions.showPhone ? (
                    <a
                      href="tel:"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Show Contact
                    </a>
                  ) : null}
                  {listing.contactOptions.whatsapp ? (
                    <a
                      href={`https://wa.me/${listing.contactOptions.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {listing.contactOptions.telegram ? (
                    <a
                      href={`https://t.me/${listing.contactOptions.telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                    >
                      Telegram
                    </a>
                  ) : null}
                  {listing.contactOptions.inAppMessaging && listing.seller ? (
                    <>
                      <ChatButton
                        listingId={listing.id}
                        sellerId={listing.seller.id}
                        sellerName={listing.seller.displayName}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Enhanced Seller info card */}
            {listing.seller ? (
              <SellerInfoCard 
                seller={{
                  id: listing.seller.id,
                  name: listing.seller.displayName,
                  avatarUrl: listing.seller.avatarUrl ?? null,
                  emailVerifiedAt: listing.seller.emailVerifiedAt ?? null,
                  phoneVerifiedAt: listing.seller.phoneVerifiedAt ?? null,
                  ...(listing.seller.createdAt ? { createdAt: listing.seller.createdAt } : {}),
                }}
                responseTime="Typically replies within minutes"
              />
            ) : null}

            {/* Shop Location Map */}
            {listing.seller?.location ? (
              <ShopLocationMap 
                sellerName={listing.seller.displayName}
                location={listing.seller.location}
              />
            ) : null}

            {/* Safety Tips */}
            <SafetyTips />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <MarkUnavailableButton 
                listingId={listing.id}
                listingTitle={listing.title}
                isOwner={isOwner}
              />
              <ReportAbuseButton 
                listingId={listing.id}
                listingTitle={listing.title}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <section className="mt-10" aria-labelledby="description-heading">
          <h2 id="description-heading" className="text-xl font-bold text-foreground mb-4">
            Description
          </h2>
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{listing.description}</div>
        </section>

        {/* Reviews */}
        {listing.seller && (
          <section className="mt-10" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="text-xl font-bold text-foreground mb-4">
              Reviews
            </h2>
            <ReviewSection listingId={listing.id} sellerId={listing.seller.id} />
          </section>
        )}

        {/* Related listings */}
        {relatedListings.length > 0 ? (
          <section className="mt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-bold text-foreground mb-6">
              Similar Listings
            </h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {relatedListings.map((rel) => (
                <ListingCard
                  key={rel.id}
                  id={rel.id}
                  title={rel.title}
                  price={rel.price}
                  {...(rel.primaryImageUrl !== undefined ? { imageUrl: rel.primaryImageUrl } : {})}
                />
              ))}
            </div>
          </section>
        ) : null}

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

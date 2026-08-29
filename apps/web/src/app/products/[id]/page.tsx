import { Badge } from '@marketplace/ui'
import { cookies } from 'next/headers'
import Link from 'next/link'
import React from 'react'

import Container from '../../../components/Container'
import FavoriteButton from '../../../components/marketplace/FavoriteButton'
import ImageGallery from '../../../components/marketplace/ImageGallery'
import ListingAttributes from '../../../components/marketplace/ListingAttributes'
import ListingCard from '../../../components/marketplace/ListingCard'
import MarkUnavailableButton from '../../../components/marketplace/MarkUnavailableButton'
import ReportAbuseButton from '../../../components/marketplace/ReportAbuseButton'
import SafetyTips from '../../../components/marketplace/SafetyTips'
import ShareButton from '../../../components/marketplace/ShareButton'
import RevealContact from '../../../components/marketplace/RevealContact'
import ContactSellerButton from '../../../components/marketplace/ContactSellerButton'
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
    phone?: string | null
    createdAt?: string
    sellerType?: string | null
    isVerifiedDesigner?: boolean
    responseRate?: number | null
    responseTimeHours?: number | null
    totalSales?: number | null
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
  minRentalDurationDays?: number
  maxRentalDurationDays?: number | null
  cleaningPolicy?: string | null
  fabricCareTags?: string[]
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
  attributes?: {
    material?: string
    careInstructions?: string
    size?: string
    brand?: string
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
      title: `${listing.title} — Ethiopian Fashion Marketplace`,
      description: listing.description.slice(0, 160),
      openGraph: {
        title: `${listing.title} — Ethiopian Fashion Marketplace`,
        description: listing.description.slice(0, 160),
        url: `${siteUrl}/products/${listing.id}`,
        ...(listing.primaryImageUrl ? { images: [listing.primaryImageUrl] } : {}),
        type: 'website',
      },
      alternates: {
        canonical: `${siteUrl}/products/${listing.id}`,
      },
    }
  } catch {
    return { title: `Product — Ethiopian Fashion Marketplace` }
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  let cookieHeader: string | undefined
  try {
    const cookieStore = await cookies()
    cookieHeader = cookieStore.toString()
  } catch {
    // fallback if no cookie context
  }

  let listing: ListingData | null = null
  let relatedListings: { id: string; title: string; price: number; condition: string; city: string; primaryImageUrl?: string | null }[] = []
  let sellerListings: { id: string; title: string; price: number; condition: string; city: string; primaryImageUrl?: string | null }[] = []

  try {
    const listingRes = await serverGet<ListingData>(`/listings/${id}`, {
      ...(cookieHeader ? { cookieHeader } : {}),
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

  if (listing?.seller?.id) {
    try {
      const sellerRes = await serverGet<typeof sellerListings>('/listings', {
        revalidate: 60,
        params: { sellerId: listing.seller.id, limit: 4 },
      })
      sellerListings = sellerRes.filter((l) => l.id !== listing.id)
    } catch {
      // Graceful fallback
    }
  }

  if (!listing) {
    return (
      <Container>
        <section className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
          <p className="mt-4 text-muted-foreground">The product you are looking for does not exist or has been removed.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary/80">
            Go to homepage
          </Link>
        </section>
      </Container>
    )
  }

  const currentUser = await optionalUser()
  const isOwner = currentUser ? currentUser.id === listing.seller?.id : false

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
    url: `${siteUrl}/products/${listing.id}`,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.currency,
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

  return (
    <Container>
      <section className="py-4 md:py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-4 md:mb-6" aria-label="Breadcrumb">
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

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Image gallery - 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            <ImageGallery images={galleryImages} />
            
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

          {/* Product info - 2 cols */}
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
              <div className="flex items-baseline gap-4 flex-wrap">
                <p className="text-3xl md:text-4xl font-bold text-primary">{listing.currency}{listing.price.toLocaleString()}</p>
              </div>
              {listing.availableForRent && listing.rentalPricePerDay != null && (
                <p className="text-base text-muted-foreground">
                  or rent for {listing.currency}{listing.rentalPricePerDay.toLocaleString()}/day
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {listing.condition ? (
                <Badge variant={conditionVariant[listing.condition] ?? 'default'}>
                  {listing.condition.replace('_', ' ')}
                </Badge>
              ) : null}
              {listing.isFeatured ? <Badge variant="warning">Featured</Badge> : null}
              {listing.availableForRent ? <Badge variant="info">Available to Rent</Badge> : null}
              {listing.supportsCustomDesign ? <Badge variant="success">Custom-Made Available</Badge> : null}
            </div>

            {/* Combined Card - Contact, Location, Seller Info (Jiji-style compact) */}
            {listing.seller && (
              <div className="rounded-xl border bg-card p-4 space-y-4 sticky top-4 shadow-sm">
                {/* Seller Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {listing.seller.avatarUrl ? (
                      <img 
                        src={listing.seller.avatarUrl} 
                        alt={listing.seller.displayName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <Link 
                        href={`/sellers/${listing.seller.id}`}
                        className="font-semibold text-foreground hover:underline"
                      >
                        {listing.seller.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {listing.seller.createdAt 
                          ? `${Math.floor((Date.now() - new Date(listing.seller.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365)) + 1}+ years on marketplace`
                          : 'Member on marketplace'}
                      </p>
                    </div>
                  </div>
                  {listing.seller.responseTimeHours && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Typically replies within {listing.seller.responseTimeHours}h
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
                  href={`/sellers/${listing.seller.id}/reviews`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <span className="text-sm font-medium text-foreground">24 Reviews</span>
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

        {/* Material & Care - below grid */}
        {listing.attributes && (
          <section className="mt-6" aria-labelledby="details-heading">
            <h2 id="details-heading" className="text-2xl font-bold text-foreground mb-4">
              Details
            </h2>
            <div className="rounded-xl border bg-card p-6">
              <div className="space-y-3 text-base text-muted-foreground">
                {listing.attributes.material && (
                  <p><span className="font-medium text-foreground">Material:</span> {listing.attributes.material}</p>
                )}
                {listing.attributes.careInstructions && (
                  <p><span className="font-medium text-foreground">Care Instructions:</span> {listing.attributes.careInstructions}</p>
                )}
                {listing.fabricCareTags && listing.fabricCareTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {listing.fabricCareTags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Rental Terms */}
        {listing.availableForRent && (
          <div className="mt-6 rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Rental Terms</h3>
            <div className="space-y-3 text-base text-muted-foreground">
              <p><span className="font-medium text-foreground">Duration:</span> {listing.minRentalDurationDays ?? 1} day{(listing.minRentalDurationDays ?? 1) > 1 ? 's' : ''} minimum
                {listing.maxRentalDurationDays && ` - ${listing.maxRentalDurationDays} days maximum`}
              </p>
              {listing.rentalDeposit && listing.rentalDeposit > 0 && (
                <p><span className="font-medium text-foreground">Security Deposit:</span> {listing.currency}{listing.rentalDeposit.toLocaleString()} (returnable)</p>
              )}
              {listing.cleaningPolicy && (
                <p><span className="font-medium text-foreground">Cleaning Policy:</span> {listing.cleaningPolicy}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Pickup and return location to be agreed with seller
              </p>
            </div>
          </div>
        )}

        {/* Custom-Made Options */}
        {listing.supportsCustomDesign && (
          <div className="mt-6 rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Custom-Made Available</h3>
            <div className="space-y-3 text-base text-muted-foreground">
              {listing.startingCustomPrice && (
                <p><span className="font-medium text-foreground">Starting Price:</span> {listing.currency}{listing.startingCustomPrice.toLocaleString()}</p>
              )}
              {listing.estimatedProductionDays && (
                <p><span className="font-medium text-foreground">Estimated Production:</span> {listing.estimatedProductionDays} days</p>
              )}
              {listing.customizationOptions?.requiresMeasurements && (
                <p className="text-sm text-primary">✓ Body measurements required for custom fit</p>
              )}
              {listing.customizationOptions?.fabricTypes && listing.customizationOptions.fabricTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {listing.customizationOptions.fabricTypes.map((fabric) => (
                    <Badge key={fabric} variant="secondary">{fabric}</Badge>
                  ))}
                </div>
              )}
            </div>
            {listing.contactOptions?.inAppMessaging && (
              <Link
                href={`/dashboard/messages?listing=${listing.id}&seller=${listing.seller?.id}`}
                className="inline-flex items-center gap-2 mt-3 text-base font-medium text-primary hover:text-primary/80"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Discuss Customization
              </Link>
            )}
          </div>
        )}

        {/* Trust & Safety */}
        <section className="mt-8 md:mt-10" aria-labelledby="safety-heading">
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-4">
            <h2 id="safety-heading" className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Safety Tips
            </h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Inspect delicate traditional embroidery and fittings thoroughly during physical handover</li>
              <li>• Meet in safe, public locations for in-person transactions</li>
              <li>• Verify the seller's identity and contact information before payment</li>
              <li>• Keep records of all communications and agreements</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <ReportAbuseButton 
                listingId={listing.id}
                listingTitle={listing.title}
              />
            </div>
          </div>
        </section>

        {/* More From This Seller */}
        {sellerListings.length > 0 ? (
          <section className="mt-8 md:mt-10" aria-labelledby="seller-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="seller-heading" className="text-xl font-bold text-foreground">
                More From This Seller
              </h2>
              <Link
                href={`/sellers/${listing.seller?.id}`}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                View All →
              </Link>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              {sellerListings.slice(0, 4).map((sellerListing) => (
                <ListingCard
                  key={sellerListing.id}
                  id={sellerListing.id}
                  title={sellerListing.title}
                  price={sellerListing.price}
                  {...(sellerListing.primaryImageUrl !== undefined ? { imageUrl: sellerListing.primaryImageUrl } : {})}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Similar Listings */}
        {relatedListings.length > 0 ? (
          <section className="mt-8 md:mt-10" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-bold text-foreground mb-4">
              Similar Listings
            </h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </section>
    </Container>
  )
}

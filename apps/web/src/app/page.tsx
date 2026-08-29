import Link from 'next/link'
import React from 'react'

import Container from '../components/Container'
import CategoryCard from '../components/marketplace/CategoryCard'
import HeroSearch, { type HeroBannerData } from '../components/marketplace/HeroSearch'
import ListingCard from '../components/marketplace/ListingCard'
import NewsletterForm from '../components/marketplace/NewsletterForm'
import ProductCarousel from '../components/marketplace/ProductCarousel'
import SellerCard from '../components/marketplace/SellerCard'
import { serverGet } from '../lib/serverApi'

interface ListingData {
  id: string
  title: string
  price: number
  condition?: string
  city?: string
  primaryImageUrl?: string | null
  images?: { id?: string; url: string; sortOrder?: number }[]
  isFeatured?: boolean
  listingType?: 'buy' | 'rent' | 'custom'
}

interface CategoryData {
  id: string
  name: string
  slug: string
  imageUrl?: string | null
  parentId?: string | null
  _count?: { listings: number }
}

interface SellerData {
  id: string
  name?: string
  displayName?: string
  avatarUrl?: string | null
  location?: string | null
  city?: string
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
}

interface CmsSection {
  id: string
  key: string
  title: string
  subtitle?: string | null
  sortOrder: number
  itemCount: number
  contentSource: string
  items: any[]
}

interface CmsSeoData {
  title: string
  description: string
  ogImageUrl?: string | null
}

interface CmsLayoutData {
  heroBanners: HeroBannerData[]
  sections: CmsSection[]
  seo: CmsSeoData
}

export async function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  let seoTitle = 'Ethiopian Fashion Marketplace — Buy, Rent & Custom Order'
  let seoDesc = 'Discover Ethiopian fashion. Buy ready-to-wear, rent for special occasions, or order custom-made outfits from talented designers.'
  let ogImage: string | undefined = undefined

  try {
    const seoRes = await serverGet<{ data: CmsSeoData }>('/homepage/seo', { revalidate: 120 })
    if (seoRes?.data) {
      if (seoRes.data.title) seoTitle = seoRes.data.title
      if (seoRes.data.description) seoDesc = seoRes.data.description
      if (seoRes.data.ogImageUrl) ogImage = seoRes.data.ogImageUrl
    }
  } catch {
    // Fallback to defaults
  }

  return {
    title: seoTitle,
    description: seoDesc,
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: siteUrl,
      siteName: 'Ethiopian Fashion Marketplace',
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  }
}

function listingImageUrl(listing: ListingData): string | null {
  return listing.primaryImageUrl ?? listing.images?.[0]?.url ?? null
}

export default async function HomePage() {
  let cmsLayout: CmsLayoutData | null = null

  try {
    const layoutRes = await serverGet<any>('/homepage/layout', { revalidate: 60 })
    if (layoutRes) {
      cmsLayout = layoutRes.data ? layoutRes.data : layoutRes
    }
  } catch {
    // Graceful fallback
  }

  const heroBanners = cmsLayout?.heroBanners || []
  const sections = cmsLayout?.sections || []

  // Helper to render individual CMS section
  const renderSection = (section: CmsSection) => {
    switch (section.key) {
      case 'categories': {
        const categories: CategoryData[] = section.items || []
        if (categories.length === 0) return null

        return (
          <section key={section.id} className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{section.title}</h2>
                {section.subtitle && <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>}
              </div>
              <Link
                href="/search"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Browse all &rarr;
              </Link>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  slug={cat.slug}
                  name={cat.name}
                  {...(cat.imageUrl ? { imageUrl: cat.imageUrl } : {})}
                  {...(cat._count?.listings !== undefined ? { listingCount: cat._count.listings } : {})}
                />
              ))}
            </div>
          </section>
        )
      }

      case 'featured_listings': {
        const listings: ListingData[] = section.items || []
        if (listings.length === 0) return null

        return (
          <section key={section.id} className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{section.title}</h2>
                {section.subtitle && <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>}
              </div>
              <Link
                href="/search?featured=true"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  {...(listingImageUrl(listing) ? { imageUrl: listingImageUrl(listing) } : {})}
                  {...(listing.listingType ? { listingType: listing.listingType } : {})}
                />
              ))}
            </div>
          </section>
        )
      }

      case 'new_arrivals': {
        const listings: ListingData[] = section.items || []

        return (
          <section key={section.id} className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{section.title}</h2>
                {section.subtitle && <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>}
              </div>
              <Link
                href="/search?sortBy=newest"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all &rarr;
              </Link>
            </div>
            {listings.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    price={listing.price}
                    {...(listingImageUrl(listing) ? { imageUrl: listingImageUrl(listing) } : {})}
                    {...(listing.listingType ? { listingType: listing.listingType } : {})}
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
        )
      }

      case 'trending':
      case 'featured_sellers': {
        const sellers: SellerData[] = section.items || []
        if (sellers.length === 0) return null

        return (
          <section key={section.id} className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{section.title}</h2>
                {section.subtitle && <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>}
              </div>
              <Link
                href="/search"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all &rarr;
              </Link>
            </div>
            <ProductCarousel variant="featured">
              {sellers.map((seller) => (
                <SellerCard
                  key={seller.id}
                  id={seller.id}
                  name={seller.displayName || seller.name || 'Seller'}
                  {...(seller.avatarUrl ? { avatarUrl: seller.avatarUrl } : {})}
                  verified={Boolean(seller.emailVerifiedAt ?? seller.phoneVerifiedAt)}
                  {...(seller.location || seller.city ? { location: seller.location || seller.city } : {})}
                />
              ))}
            </ProductCarousel>
          </section>
        )
      }

      case 'rental_highlights': {
        const listings: ListingData[] = section.items || []
        if (listings.length === 0) return null

        return (
          <section key={section.id} className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{section.title}</h2>
                {section.subtitle && <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>}
              </div>
              <Link
                href="/search?type=rent"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Explore Rentals &rarr;
              </Link>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  listingType="rent"
                  {...(listingImageUrl(listing) ? { imageUrl: listingImageUrl(listing) } : {})}
                />
              ))}
            </div>
          </section>
        )
      }

      case 'custom_design': {
        const listings: ListingData[] = section.items || []
        if (listings.length === 0) return null

        return (
          <section key={section.id} className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">{section.title}</h2>
                {section.subtitle && <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>}
              </div>
              <Link
                href="/search?type=custom"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Custom Orders &rarr;
              </Link>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  listingType="custom"
                  {...(listingImageUrl(listing) ? { imageUrl: listingImageUrl(listing) } : {})}
                />
              ))}
            </div>
          </section>
        )
      }

      case 'how_it_works':
        return (
          <section key={section.id} className="py-12" aria-labelledby="trust-heading">
            <div className="text-center mb-8">
              <h2 id="trust-heading" className="font-display text-2xl font-bold text-foreground">
                {section.title}
              </h2>
              {section.subtitle && <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground text-sm">Verified Sellers</p>
                  <p className="text-xs text-muted-foreground">All designers are verified</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground text-sm">Secure Payments</p>
                  <p className="text-xs text-muted-foreground">Protected transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.613-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground text-sm">Quality Reviews</p>
                  <p className="text-xs text-muted-foreground">Honest buyer feedback</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-wine/10 text-brand-wine">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground text-sm">Ethiopian Made</p>
                  <p className="text-xs text-muted-foreground">Support local artisans</p>
                </div>
              </div>
            </div>
          </section>
        )

      case 'testimonials':
        return (
          <section key={section.id} className="py-12" aria-labelledby="testimonials-heading">
            <div className="text-center mb-10">
              <h2 id="testimonials-heading" className="font-display text-2xl font-bold text-foreground">
                {section.title}
              </h2>
              {section.subtitle && <p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p>}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-1 mb-3 text-brand-gold">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">&ldquo;I ordered a custom Habesha Kemis for my wedding and it was absolutely stunning. The designer was attentive and the fit was perfect.&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-card-foreground">— Sara M., Addis Ababa</p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-1 mb-3 text-brand-gold">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">&ldquo;Renting a suit for my graduation was so easy and affordable. The quality was top-notch and delivery was on time.&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-card-foreground">— Dawit K., Bahir Dar</p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-1 mb-3 text-brand-gold">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">&ldquo;As a designer, this platform has helped me reach customers across Ethiopia. The custom order system is a game changer.&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-card-foreground">— Hana T., Designer</p>
              </div>
            </div>
          </section>
        )

      case 'newsletter':
        return (
          <section key={section.id} className="py-12 rounded-2xl bg-brand-gold/5 px-6 md:px-12 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">{section.title}</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {section.subtitle || 'Get the latest fashion drops, designer spotlights, and exclusive rental deals delivered to your inbox.'}
            </p>
            <NewsletterForm />
          </section>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Hero Banner Section */}
      <HeroSearch banners={heroBanners} />

      <Container>
        {sections.length > 0 ? (
          sections.map((section) => renderSection(section))
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Welcome to Ethiopian Fashion Marketplace.
          </div>
        )}

        {/* Static CTA Banner */}
        <section className="py-12">
          <div className="rounded-2xl bg-gradient-to-r from-brand-gold/10 via-brand-wine/10 to-primary/10 p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">Ready to Showcase Your Style?</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Whether you are a designer looking to sell your creations or a fashion lover seeking something unique, join our marketplace today.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link
                href="/search"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Explore Fashion
              </Link>
              <Link
                href="/dashboard/seller"
                className="rounded-lg border bg-card px-6 py-3 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </>
  )
}

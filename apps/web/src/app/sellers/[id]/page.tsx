import { Avatar, Badge } from '@marketplace/ui'
import Link from 'next/link'
import React from 'react'

import Container from '../../../components/Container'
import ListingCard from '../../../components/marketplace/ListingCard'
import { serverGet } from '../../../lib/serverApi'

interface SellerData {
  id: string
  name: string
  email?: string
  bio?: string | null
  avatarUrl?: string | null
  phone?: string | null
  location?: string | null
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
  _count?: {
    listings: number
  }
}

interface ListingData {
  id: string
  title: string
  price: number
  condition: string
  city: string
  primaryImageUrl?: string | null
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
    const res = await serverGet<{ success: boolean; data: SellerData }>(`/users/${params.id}`, {
      revalidate: 120,
    })
    const u = res.data
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    return {
      title: `${u.name} — Marketplace`,
      description: u.bio?.slice(0, 160) ?? `View ${u.name}'s profile and listings.`,
      openGraph: {
        title: `${u.name} — Marketplace`,
        description: u.bio?.slice(0, 160) ?? `View ${u.name}'s profile and listings.`,
        url: `${siteUrl}/sellers/${u.id}`,
        ...(u.avatarUrl && { images: [u.avatarUrl] }),
        type: 'profile',
      },
    }
  } catch {
    return { title: `Seller — Marketplace` }
  }
}

export default async function SellerPage({ params, searchParams }: Props) {
  const { id } = params
  const currentPage = Number(searchParams.page ?? '1')

  let seller: SellerData | null = null
  let listings: ListingData[] = []
  let totalPages = 1

  try {
    const [sellerRes, listingsRes] = await Promise.allSettled([
      serverGet<{ success: boolean; data: SellerData }>(`/users/${id}`, { revalidate: 120 }),
      serverGet<PaginatedResponse<ListingData>>(`/users/${id}/listings`, {
        revalidate: 60,
        params: { page: currentPage, limit: 12 },
      }),
    ])

    if (sellerRes.status === 'fulfilled') {
      seller = sellerRes.value.data
    }
    if (listingsRes.status === 'fulfilled') {
      listings = listingsRes.value.data
      totalPages = listingsRes.value.meta.totalPages
    }
  } catch {
    // Graceful fallback
  }

  if (!seller) {
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

  return (
    <Container>
      <section className="py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{seller.name}</span>
        </nav>

        {/* Seller header */}
        <div className="rounded-lg border bg-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar
              name={seller.name}
              {...(seller.avatarUrl !== undefined && { src: seller.avatarUrl })}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-card-foreground">{seller.name}</h1>
                {(seller.emailVerifiedAt ?? seller.phoneVerifiedAt) && (
                  <Badge variant="success">Verified</Badge>
                )}
              </div>

              {seller.bio && <p className="mt-2 text-muted-foreground">{seller.bio}</p>}

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {seller.location && (
                  <span className="flex items-center gap-1">
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
                    {seller.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Member since {memberSince}
                </span>
              </div>

              {/* Verification badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {seller.emailVerifiedAt && <Badge variant="info">Email Verified</Badge>}
                {seller.phoneVerifiedAt && <Badge variant="info">Phone Verified</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground">{String(seller._count?.listings ?? 0)}</p>
            <p className="text-sm text-muted-foreground">Listings</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground">
              {(seller.emailVerifiedAt ?? seller.phoneVerifiedAt) ? 'Yes' : 'No'}
            </p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground">
              {memberSince.split(' ')[1]?.slice(0, 3) ?? '—'}
            </p>
            <p className="text-sm text-muted-foreground">Since</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground">—</p>
            <p className="text-sm text-muted-foreground">Response Rate</p>
          </div>
        </div>

        {/* Seller listings */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">{seller.name}&apos;s Listings</h2>

          {listings.length > 0 ? (
            <>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((listing) => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
                  {currentPage > 1 && (
                    <Link
                      href={`/sellers/${id}?page=${String(currentPage - 1)}`}
                      className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm transition-colors hover:bg-accent"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm bg-primary text-primary-foreground">
                    Page {String(currentPage)} of {String(totalPages)}
                  </span>
                  {currentPage < totalPages && (
                    <Link
                      href={`/sellers/${id}?page=${String(currentPage + 1)}`}
                      className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm transition-colors hover:bg-accent"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-muted-foreground">This seller has no active listings.</p>
            </div>
          )}
        </div>
      </section>
    </Container>
  )
}

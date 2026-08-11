import Link from 'next/link'
import React from 'react'

import Container from '../../../components/Container'
import ListingCard from '../../../components/marketplace/ListingCard'
import { serverGet } from '../../../lib/serverApi'

interface CategoryData {
  id: string
  name: string
  nameAm?: string | null
  slug: string
  slugAm?: string | null
  description?: string | null
  descriptionAm?: string | null
  imageUrl?: string | null
  children?: {
    id: string
    name: string
    nameAm?: string | null
    slug: string
  }[]
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
  params: { slug: string }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: Props) {
  try {
    const res = await serverGet<CategoryData>(`/categories/${params.slug}`, {
      revalidate: 120,
    })
    const cat = res
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    return {
      title: `${cat.name} — Marketplace`,
      description: cat.description?.slice(0, 160) ?? `Browse ${cat.name} listings on our marketplace.`,
      openGraph: {
        title: `${cat.name} — Marketplace`,
        description: cat.description?.slice(0, 160) ?? `Browse ${cat.name} listings.`,
        url: `${siteUrl}/categories/${cat.slug}`,
        type: 'website',
      },
    }
  } catch {
    return { title: `Category — Marketplace` }
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = params
  const currentPage = Number(searchParams.page ?? '1')

  let category: CategoryData | null = null
  let listings: ListingData[] = []
  let totalPages = 1

  try {
    const [categoryRes, listingsRes] = await Promise.allSettled([
      serverGet<CategoryData>(`/categories/${slug}`, { revalidate: 120 }),
      serverGet<PaginatedResponse<ListingData>>('/listings', {
        revalidate: 60,
        params: { categorySlug: slug, page: currentPage, limit: 12 },
      }),
    ])

    if (categoryRes.status === 'fulfilled') {
      category = categoryRes.value
    }
    if (listingsRes.status === 'fulfilled') {
      listings = listingsRes.value.data
      totalPages = listingsRes.value.meta.totalPages
    }
  } catch {
    // Graceful fallback
  }

  if (!category) {
    return (
      <Container>
        <section className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Category Not Found</h1>
          <p className="mt-4 text-muted-foreground">The category you are looking for does not exist.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary/80">
            Go to homepage
          </Link>
        </section>
      </Container>
    )
  }

  return (
    <Container>
      <section className="py-8">
        {/* Category header */}
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
          <h1 className="text-3xl font-bold text-foreground">
            {category.name}
            {category.nameAm && <span className="ml-2 text-xl text-muted-foreground" dir="rtl">{category.nameAm}</span>}
          </h1>
          {category.description && (
            <p className="mt-2 text-muted-foreground">
              {category.description}
              {category.descriptionAm && <span className="block mt-1" dir="rtl">{category.descriptionAm}</span>}
            </p>
          )}
        </div>

        {/* Subcategory navigation */}
        {category.children && category.children.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2" role="navigation" aria-label="Subcategories">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
              >
                {child.name}
                {child.nameAm && <span className="ml-2 text-muted-foreground" dir="rtl">{child.nameAm}</span>}
              </Link>
            ))}
          </div>
        )}

        {/* Listings */}
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
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
                {currentPage > 1 && (
                  <Link
                    href={`/categories/${slug}?page=${String(currentPage - 1)}`}
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
                    href={`/categories/${slug}?page=${String(currentPage + 1)}`}
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
            <p className="text-muted-foreground">No listings found in this category.</p>
            <Link href="/search" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80">
              Browse all listings
            </Link>
          </div>
        )}
      </section>
    </Container>
  )
}

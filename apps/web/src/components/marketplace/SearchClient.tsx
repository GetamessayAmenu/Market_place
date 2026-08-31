"use client"

import { Button, cn } from '@marketplace/ui'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useCategories } from '../../hooks/useCategories'
import { useSearch } from '../../hooks/useSearch'
import Container from '../Container'

import FilterPanel, { type FilterValues } from './FilterPanel'
import ListingCard from './ListingCard'
import ListingCardSkeleton from './ListingCardSkeleton'
import NoResultsRecovery from './NoResultsRecovery'
import SearchBar from './SearchBar'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
]

export default function SearchClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQ = searchParams.get('q') ?? ''
  const initialPage = Number(searchParams.get('page') ?? '1')
  const initialSort = searchParams.get('sortBy') ?? 'relevance'
  const initialCategory = searchParams.get('categoryId') ?? ''
  const initialCondition = searchParams.get('condition') ?? ''
  const initialMinPrice = searchParams.get('minPrice') ?? ''
  const initialMaxPrice = searchParams.get('maxPrice') ?? ''
  const initialCity = searchParams.get('city') ?? ''
  const initialType = searchParams.get('type') ?? ''

  const [query, setQuery] = useState(initialQ)
  const [page, setPage] = useState(initialPage)
  const [sortBy, setSortBy] = useState(initialSort)
  const [_mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const { data: categoriesRes } = useCategories()

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const categoryOptions = useMemo(() => {
    const cats = categoriesRes ?? []
    return cats.map((c) => ({
      value: c.id,
      label: c.name,
      ...(c.children && c.children.length > 0 ? {
        children: c.children.map((child) => ({
          value: child.id,
          label: child.name,
        })),
      } : {}),
    }))
  }, [categoriesRes])

  const searchParamsObj = useMemo(
    () => ({
      q: query || undefined,
      sortBy,
      page,
      limit: 12,
      categoryId: initialCategory || undefined,
      condition: initialCondition || undefined,
      minPrice: initialMinPrice || undefined,
      maxPrice: initialMaxPrice || undefined,
      city: initialCity || undefined,
      type: initialType || undefined,
      availableForRent: initialType === 'rent' ? true : undefined,
      supportsCustomDesign: initialType === 'custom' ? true : undefined,
    }),
    [query, sortBy, page, initialCategory, initialCondition, initialMinPrice, initialMaxPrice, initialCity, initialType]
  )

  const { data, isLoading, isError, refetch } = useSearch(searchParamsObj)

  // Context-aware Page Title
  const getPageTitle = () => {
    if (initialType === 'rent') {
      return query ? `Rental results for "${query}"` : 'Rent Ethiopian Fashion'
    }
    if (initialType === 'custom') {
      return query ? `Custom-order results for "${query}"` : 'Custom Ethiopian Fashion'
    }
    return query ? `Shop results for "${query}"` : 'Shop Ethiopian Fashion'
  }

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (page > 1) params.set('page', String(page))
    if (sortBy !== 'relevance') params.set('sortBy', sortBy)
    if (initialCategory) params.set('categoryId', initialCategory)
    if (initialCondition) params.set('condition', initialCondition)
    if (initialMinPrice) params.set('minPrice', initialMinPrice)
    if (initialMaxPrice) params.set('maxPrice', initialMaxPrice)
    if (initialCity) params.set('city', initialCity)
    if (initialType) params.set('type', initialType)

    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
    router.replace(newUrl, { scroll: false })
  }, [query, page, sortBy, initialCategory, initialCondition, initialMinPrice, initialMaxPrice, initialCity, initialType, router])

  const handleSearch = useCallback((q: string, _city?: string) => {
    setQuery(q)
    setPage(1)
  }, [])

  const handleSort = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value)
    setPage(1)
  }, [])

  const handleFilterApply = useCallback(
    (values: FilterValues) => {
      const params = new URLSearchParams()
      if (values.query || query) params.set('q', values.query || query)
      if (values.category) params.set('categoryId', values.category)
      if (values.condition) params.set('condition', values.condition)
      if (values.minPrice) params.set('minPrice', values.minPrice)
      if (values.maxPrice) params.set('maxPrice', values.maxPrice)
      if (values.city) params.set('city', values.city)
      const typeFilter = (values.listingTypes ?? [])[0]
      if (typeFilter) params.set('type', typeFilter)
      router.push(`/search?${params.toString()}`)
      setMobileDrawerOpen(false)
    },
    [query, router]
  )

  const handleFilterReset = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    router.push(`/search?${params.toString()}`)
    setMobileDrawerOpen(false)
  }, [query, router])

  // Extract listings array safely across all API response wrapper formats
  const listings: any[] = useMemo(() => {
    if (Array.isArray(data)) return data
    if (Array.isArray((data as any)?.data)) return (data as any).data
    return []
  }, [data])

  const total = (data as any)?.meta?.total ?? listings.length
  const totalPages = Math.ceil(total / 12) || 1
  const counts = (data as any)?.meta?.counts ?? { buy: 18, rent: 8, custom: 11 }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Hero Search Section */}
      <div className="bg-card border-b py-6 shadow-xs">
        <Container>
          <SearchBar
            defaultValue={query}
            onSearch={handleSearch}
            isSearching={isLoading}
            variant="hero"
          />
        </Container>
      </div>

      <Container className="pt-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <span className="font-medium text-foreground">
            {getPageTitle()}
          </span>
        </nav>

        {/* Results Header: Title, Count Badge, Sort Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {getPageTitle()}
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
              {total} listings found
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <label className="text-xs font-medium text-muted-foreground shrink-0">Sort by:</label>
            <select
              value={sortBy}
              onChange={handleSort}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              className="md:hidden text-xs font-medium"
              onClick={() => setMobileDrawerOpen(true)}
            >
              Filters
            </Button>
          </div>
        </div>

        {/* Active Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {initialCategory && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
              <span>Category selected</span>
              <button onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete('categoryId')
                router.push(`/search?${params.toString()}`)
              }} className="hover:text-emerald-900 font-bold">&times;</button>
            </span>
          )}
          {initialCity && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
              <span>📍 {initialCity}</span>
              <button onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete('city')
                router.push(`/search?${params.toString()}`)
              }} className="hover:text-emerald-900 font-bold">&times;</button>
            </span>
          )}
          {initialType && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="capitalize">{initialType === 'buy' ? 'Buy' : initialType === 'rent' ? 'Rent' : 'Custom Order'}</span>
              <button onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete('type')
                router.push(`/search?${params.toString()}`)
              }} className="hover:text-emerald-900 font-bold">&times;</button>
            </span>
          )}
          {(initialCategory || initialCity || initialType || query) && (
            <button
              onClick={handleFilterReset}
              className="text-xs font-semibold text-emerald-600 hover:underline ml-1"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Main 2-Column Grid (Sidebar FilterPanel + Product Card Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Desktop Sidebar */}
          <div className="hidden md:block md:col-span-1">
            <FilterPanel
              categoryOptions={categoryOptions}
              counts={counts}
              initialValues={{
                query,
                category: initialCategory,
                condition: initialCondition,
                minPrice: initialMinPrice,
                maxPrice: initialMaxPrice,
                city: initialCity,
                listingTypes: initialType ? [initialType as any] : [],
              }}
              onApplyFilters={handleFilterApply}
              onResetFilters={handleFilterReset}
            />
          </div>

          {/* Right Product Grid Area */}
          <div className="md:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                <p className="text-sm font-medium text-destructive">Failed to load marketplace listings.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
                  Retry
                </Button>
              </div>
            ) : listings.length === 0 ? (
              <NoResultsRecovery query={query} onClearFilters={handleFilterReset} />
            ) : (
              <>
                {/* 4-Column Product Cards Matching Mockup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {listings.map((item: any) => (
                    <ListingCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      price={item.price}
                      currency="ETB"
                      activeMode={(initialType as any) || 'buy'}
                      imageUrl={item.primaryImageUrl || (item.images && item.images[0]?.url) || null}
                      location={item.city || 'Addis Ababa'}
                      designerName={item.category?.name || item.seller?.name || 'Habesha Designer'}
                      verifiedSeller={true}
                      rating="4.7"
                      supportsReadyMade={item.supportsReadyMade ?? true}
                      supportsCustomDesign={item.supportsCustomDesign ?? false}
                      startingCustomPrice={item.startingCustomPrice}
                      availableForRent={item.availableForRent ?? false}
                      rentalPricePerDay={item.rentalPricePerDay}
                    />
                  ))}
                </div>

                {/* Bottom Green Pagination matching Mockup */}
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                        const pNum = idx + 1
                        const isActive = pNum === page
                        return (
                          <button
                            key={pNum}
                            onClick={() => setPage(pNum)}
                            className={cn(
                              'h-9 w-9 rounded-lg font-bold text-xs sm:text-sm transition-all',
                              isActive
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-card border hover:bg-muted text-foreground'
                            )}
                          >
                            {pNum}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Scroll to Top Floating Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 rounded-full border bg-card p-3 text-foreground shadow-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200"
          aria-label="Scroll to top"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  )
}

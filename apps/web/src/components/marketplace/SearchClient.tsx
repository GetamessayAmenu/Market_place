"use client"

import { Button } from '@marketplace/ui'
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
  const initialCategory = searchParams.get('categoryId') ?? searchParams.get('category') ?? ''
  const initialCondition = searchParams.get('condition') ?? ''
  const initialMinPrice = searchParams.get('minPrice') ?? ''
  const initialMaxPrice = searchParams.get('maxPrice') ?? ''
  const initialCity = searchParams.get('city') ?? ''
  const initialType = searchParams.get('type') ?? ''

  const [query, setQuery] = useState(initialQ)
  const [page, setPage] = useState(initialPage)
  const [sortBy, setSortBy] = useState(initialSort)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const { data: categoriesRes } = useCategories()

  useEffect(() => {
    setQuery(initialQ)
    setPage(initialPage)
    setSortBy(initialSort)
  }, [initialQ, initialPage, initialSort])

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

  // Lookup active category label for filter badge
  const activeCategoryObj = useMemo(() => {
    if (!initialCategory || !categoriesRes) return null
    for (const cat of categoriesRes) {
      if (cat.id === initialCategory || cat.slug === initialCategory) {
        return { id: cat.id, name: cat.name, parentName: null, parentId: null }
      }
      if (cat.children) {
        for (const child of cat.children) {
          if (child.id === initialCategory || child.slug === initialCategory) {
            return { id: child.id, name: child.name, parentName: cat.name, parentId: cat.id }
          }
        }
      }
    }
    return { id: initialCategory, name: 'Category', parentName: null, parentId: null }
  }, [initialCategory, categoriesRes])

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
    if (activeCategoryObj) {
      if (activeCategoryObj.parentName) {
        return `${activeCategoryObj.parentName} → ${activeCategoryObj.name}`
      }
      return activeCategoryObj.name
    }
    if (initialType === 'buy') {
      return query ? `Shop results for "${query}"` : 'Shop Ethiopian Fashion'
    }
    if (initialType === 'rent') {
      return query ? `Rental results for "${query}"` : 'Rent Ethiopian Fashion'
    }
    if (initialType === 'custom') {
      return query ? `Custom-order results for "${query}"` : 'Custom Ethiopian Fashion'
    }
    return query ? `All results for "${query}"` : 'All Ethiopian Fashion'
  }

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
      if (query || values.query) params.set('q', query || values.query || '')
      if (values.category) params.set('categoryId', values.category)
      if (values.condition) params.set('condition', values.condition)
      if (values.minPrice) params.set('minPrice', values.minPrice)
      if (values.maxPrice) params.set('maxPrice', values.maxPrice)
      if (values.city) params.set('city', values.city)

      const typeFilter = values.listingTypes !== undefined
        ? (values.listingTypes.length > 0 ? values.listingTypes[0] : '')
        : initialType

      if (typeFilter) {
        params.set('type', typeFilter)
      }

      router.push(`/search?${params.toString()}`)
      setMobileDrawerOpen(false)
    },
    [query, initialType, router]
  )

  const handleFilterReset = useCallback(() => {
    setQuery('')
    setPage(1)
    router.push('/search')
  }, [router])

  const removeFilterParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`/search?${params.toString()}`)
  }

  // Safe listings array & pagination metrics extraction
  const listings = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : []

  const metaObj = (data as any)?.meta
  const totalCount = metaObj?.total ?? listings.length
  const totalPages = metaObj?.totalPages ?? (Math.ceil(totalCount / 12) || 1)
  const modeCounts = metaObj?.counts
  const categoryCounts = metaObj?.categoryCounts

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Search Header Banner */}
      <div className="bg-muted/40 border-b py-8">
        <Container>
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground text-center tracking-tight">
              {getPageTitle()}
            </h1>
            <SearchBar
              defaultValue={query}
              onSearch={handleSearch}
              isSearching={isLoading}
              placeholder="Search habesha dress, rental, designers..."
            />
          </div>
        </Container>
      </div>

      <Container className="pt-8">
        {/* Active Filter Badges Banner */}
        {(activeCategoryObj || initialType || initialMinPrice || initialMaxPrice || initialCity || initialCondition || query) && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs">
            <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Active Filters:</span>

            {query && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold shadow-2xs">
                <span>&quot;{query}&quot;</span>
                <button type="button" onClick={() => handleSearch('')} className="hover:opacity-80">×</button>
              </span>
            )}

            {initialType && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                <span>Mode: {initialType.toUpperCase()}</span>
                <button type="button" onClick={() => removeFilterParam('type')} className="hover:opacity-80 font-bold">×</button>
              </span>
            )}

            {activeCategoryObj?.parentName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                <span>{activeCategoryObj.parentName}</span>
                <button type="button" onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  if (activeCategoryObj.parentId) params.set('categoryId', activeCategoryObj.parentId)
                  else params.delete('categoryId')
                  router.push(`/search?${params.toString()}`)
                }} className="hover:opacity-80 font-bold">×</button>
              </span>
            )}

            {activeCategoryObj && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold shadow-2xs">
                <span>{activeCategoryObj.name}</span>
                <button type="button" onClick={() => removeFilterParam('categoryId')} className="hover:opacity-80 font-bold">×</button>
              </span>
            )}

            {initialCity && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                <span>📍 {initialCity}</span>
                <button type="button" onClick={() => removeFilterParam('city')} className="hover:opacity-80 font-bold">×</button>
              </span>
            )}

            {initialMinPrice && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                <span>Min: {Number(initialMinPrice).toLocaleString()} ETB</span>
                <button type="button" onClick={() => removeFilterParam('minPrice')} className="hover:opacity-80 font-bold">×</button>
              </span>
            )}

            {initialMaxPrice && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                <span>Max: {Number(initialMaxPrice).toLocaleString()} ETB</span>
                <button type="button" onClick={() => removeFilterParam('maxPrice')} className="hover:opacity-80 font-bold">×</button>
              </span>
            )}

            <button
              type="button"
              onClick={handleFilterReset}
              className="ml-auto text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main Search Grid & Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterPanel
              categoryOptions={categoryOptions}
              initialValues={{
                query,
                category: initialCategory,
                condition: initialCondition,
                minPrice: initialMinPrice,
                maxPrice: initialMaxPrice,
                city: initialCity,
                listingTypes: initialType ? [initialType as 'buy' | 'rent' | 'custom'] : [],
              }}
              counts={modeCounts}
              categoryCounts={categoryCounts}
              onApplyFilters={handleFilterApply}
              onResetFilters={handleFilterReset}
            />
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Control Bar: Results Count & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                >
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filters</span>
                </button>

                <p className="text-sm font-semibold text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{listings.length}</span> of{' '}
                  <span className="font-bold text-foreground">{totalCount}</span> listings
                </p>
              </div>

              {/* Sort By Select */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  Sort:
                </label>
                <select
                  id="sort-select"
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
              </div>
            </div>

            {/* Product Grid / Skeleton / Error / Empty Recovery */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4">
                <p className="text-sm font-semibold text-destructive">
                  Unable to load search results right now.
                </p>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : listings.length === 0 ? (
              <NoResultsRecovery query={query} onClearFilters={handleFilterReset} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((l: any) => (
                  <ListingCard
                    key={l.id}
                    id={l.id}
                    title={l.title}
                    price={l.price}
                    imageUrl={l.primaryImageUrl}
                    location={l.city || l.location}
                    verifiedSeller={l.verified}
                    activeMode={(initialType as any) || 'buy'}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="font-semibold text-xs"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1 px-3 text-xs font-bold text-muted-foreground">
                  Page {page} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="font-semibold text-xs"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Scroll To Top Button */}
        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 rounded-full bg-emerald-600 p-3 text-white shadow-xl hover:bg-emerald-700 transition-all duration-200"
            aria-label="Scroll to top"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </Container>

      {/* Mobile Filters Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-background h-full shadow-2xl overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-foreground text-base">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <FilterPanel
              categoryOptions={categoryOptions}
              initialValues={{
                query,
                category: initialCategory,
                condition: initialCondition,
                minPrice: initialMinPrice,
                maxPrice: initialMaxPrice,
                city: initialCity,
                listingTypes: initialType ? [initialType as 'buy' | 'rent' | 'custom'] : [],
              }}
              counts={modeCounts}
              categoryCounts={categoryCounts}
              onApplyFilters={handleFilterApply}
              onResetFilters={handleFilterReset}
            />
          </div>
        </div>
      )}
    </div>
  )
}

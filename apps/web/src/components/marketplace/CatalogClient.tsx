"use client"

import { Button, Pagination, Select, type SelectOption } from '@marketplace/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useCategories } from '../../hooks/useCategories'
import { useSearch } from '../../hooks/useSearch'
import Container from '../Container'

import FilterSidebar, { type AdvancedFilterValues } from './FilterSidebar'
import ListingCard from './ListingCard'
import ListingCardSkeleton from './ListingCardSkeleton'
import SearchBar from './SearchBar'

const SORT_OPTIONS: SelectOption[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function CatalogClient() {
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
  
  // Advanced filters
  const initialSupportsReadyMade = searchParams.get('supportsReadyMade') === 'true'
  const initialAvailableForRent = searchParams.get('availableForRent') === 'true'
  const initialSupportsCustomDesign = searchParams.get('supportsCustomDesign') === 'true'
  const initialRentalStartDate = searchParams.get('rentalStartDate') ?? ''
  const initialRentalEndDate = searchParams.get('rentalEndDate') ?? ''
  const initialRegionalHubId = searchParams.get('regionalHubId') ?? ''
  const initialHubType = searchParams.get('hubType') ?? ''
  const initialWeavingPatterns = searchParams.getAll('weavingPatterns') ?? []
  const initialFabricTypes = searchParams.getAll('fabricTypes') ?? []
  const initialEmbroideryStyles = searchParams.getAll('embroideryStyles') ?? []
  const initialOccasionTypes = searchParams.getAll('occasionTypes') ?? []
  const initialVerifiedDesignerOnly = searchParams.get('verifiedDesignerOnly') === 'true'

  const [query, setQuery] = useState(initialQ)
  const [page, setPage] = useState(initialPage)
  const [sortBy, setSortBy] = useState(initialSort)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: categoriesRes } = useCategories()

  const categoryOptions: SelectOption[] = useMemo(() => {
    const raw: any = categoriesRes
    const cats: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
    return cats.map((c: any) => ({ value: c.id, label: c.name }))
  }, [categoriesRes])

  const conditionOptions: SelectOption[] = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ]

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
      supportsReadyMade: initialSupportsReadyMade || undefined,
      availableForRent: initialAvailableForRent || undefined,
      supportsCustomDesign: initialSupportsCustomDesign || undefined,
      rentalStartDate: initialRentalStartDate || undefined,
      rentalEndDate: initialRentalEndDate || undefined,
      regionalHubId: initialRegionalHubId || undefined,
      hubType: initialHubType || undefined,
      weavingPatterns: initialWeavingPatterns.length > 0 ? initialWeavingPatterns : undefined,
      fabricTypes: initialFabricTypes.length > 0 ? initialFabricTypes : undefined,
      embroideryStyles: initialEmbroideryStyles.length > 0 ? initialEmbroideryStyles : undefined,
      occasionTypes: initialOccasionTypes.length > 0 ? initialOccasionTypes : undefined,
      verifiedDesignerOnly: initialVerifiedDesignerOnly || undefined,
    }),
    [
      query, 
      sortBy, 
      page, 
      initialCategory, 
      initialCondition, 
      initialMinPrice, 
      initialMaxPrice, 
      initialCity,
      initialSupportsReadyMade,
      initialAvailableForRent,
      initialSupportsCustomDesign,
      initialRentalStartDate,
      initialRentalEndDate,
      initialRegionalHubId,
      initialHubType,
      initialWeavingPatterns,
      initialFabricTypes,
      initialEmbroideryStyles,
      initialOccasionTypes,
      initialVerifiedDesignerOnly,
    ]
  )

  const { data, isLoading, isError, refetch } = useSearch(searchParamsObj)

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
    if (initialSupportsReadyMade) params.set('supportsReadyMade', 'true')
    if (initialAvailableForRent) params.set('availableForRent', 'true')
    if (initialSupportsCustomDesign) params.set('supportsCustomDesign', 'true')
    if (initialRentalStartDate) params.set('rentalStartDate', initialRentalStartDate)
    if (initialRentalEndDate) params.set('rentalEndDate', initialRentalEndDate)
    if (initialRegionalHubId) params.set('regionalHubId', initialRegionalHubId)
    if (initialHubType) params.set('hubType', initialHubType)
    initialWeavingPatterns.forEach(p => params.append('weavingPatterns', p))
    initialFabricTypes.forEach(f => params.append('fabricTypes', f))
    initialEmbroideryStyles.forEach(e => params.append('embroideryStyles', e))
    initialOccasionTypes.forEach(o => params.append('occasionTypes', o))
    if (initialVerifiedDesignerOnly) params.set('verifiedDesignerOnly', 'true')

    const newUrl = params.toString() ? `/catalog?${params.toString()}` : '/catalog'
    router.replace(newUrl, { scroll: false })
  }, [
    query, 
    page, 
    sortBy, 
    initialCategory, 
    initialCondition, 
    initialMinPrice, 
    initialMaxPrice, 
    initialCity,
    initialSupportsReadyMade,
    initialAvailableForRent,
    initialSupportsCustomDesign,
    initialRentalStartDate,
    initialRentalEndDate,
    initialRegionalHubId,
    initialHubType,
    initialWeavingPatterns,
    initialFabricTypes,
    initialEmbroideryStyles,
    initialOccasionTypes,
    initialVerifiedDesignerOnly,
    router,
  ])

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    setPage(1)
  }, [])

  const handleSort = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value)
    setPage(1)
  }, [])

  const handleFilterApply = useCallback(
    (values: AdvancedFilterValues) => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (values.categoryId) params.set('categoryId', values.categoryId)
      if (values.condition) params.set('condition', values.condition)
      if (values.minPrice) params.set('minPrice', values.minPrice)
      if (values.maxPrice) params.set('maxPrice', values.maxPrice)
      if (values.city) params.set('city', values.city)
      if (values.supportsReadyMade) params.set('supportsReadyMade', 'true')
      if (values.availableForRent) params.set('availableForRent', 'true')
      if (values.supportsCustomDesign) params.set('supportsCustomDesign', 'true')
      if (values.rentalStartDate) params.set('rentalStartDate', values.rentalStartDate)
      if (values.rentalEndDate) params.set('rentalEndDate', values.rentalEndDate)
      if (values.regionalHubId) params.set('regionalHubId', values.regionalHubId)
      if (values.hubType) params.set('hubType', values.hubType)
      values.weavingPatterns?.forEach(p => params.append('weavingPatterns', p))
      values.fabricTypes?.forEach(f => params.append('fabricTypes', f))
      values.embroideryStyles?.forEach(e => params.append('embroideryStyles', e))
      values.occasionTypes?.forEach(o => params.append('occasionTypes', o))
      if (values.verifiedDesignerOnly) params.set('verifiedDesignerOnly', 'true')
      router.push(`/catalog?${params.toString()}`)
      setFiltersOpen(false)
    },
    [query, router]
  )

  const handleFilterReset = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    router.push(`/catalog?${params.toString()}`)
  }, [query, router])

  const listings = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1
  const totalResults = data?.meta?.total ?? 0

  return (
    <Container>
      <section className="py-8">
        {/* Search bar */}
        <div className="mb-6">
          <SearchBar defaultValue={query} onSearch={handleSearch} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar - toggleable on mobile */}
          <aside className="lg:w-80 flex-shrink-0">
            <button
              type="button"
              className="lg:hidden mb-3 text-sm font-medium text-primary"
              onClick={() => {
                setFiltersOpen(!filtersOpen)
              }}
              aria-expanded={filtersOpen}
            >
              {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div className={filtersOpen ? 'block' : 'hidden lg:block'}>
              <FilterSidebar
                categories={categoryOptions}
                conditions={conditionOptions}
                initialValues={{
                  categoryId: initialCategory,
                  condition: initialCondition,
                  minPrice: initialMinPrice,
                  maxPrice: initialMaxPrice,
                  city: initialCity,
                  supportsReadyMade: initialSupportsReadyMade,
                  availableForRent: initialAvailableForRent,
                  supportsCustomDesign: initialSupportsCustomDesign,
                  rentalStartDate: initialRentalStartDate,
                  rentalEndDate: initialRentalEndDate,
                  regionalHubId: initialRegionalHubId,
                  hubType: initialHubType,
                  weavingPatterns: initialWeavingPatterns,
                  fabricTypes: initialFabricTypes,
                  embroideryStyles: initialEmbroideryStyles,
                  occasionTypes: initialOccasionTypes,
                  verifiedDesignerOnly: initialVerifiedDesignerOnly,
                }}
                onApply={handleFilterApply}
                onReset={handleFilterReset}
              />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? 'Searching...'
                  : `${String(totalResults)} result${totalResults !== 1 ? 's' : ''}`}
              </p>
              <div className="w-48">
                <Select options={SORT_OPTIONS} value={sortBy} onChange={handleSort} aria-label="Sort results" />
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div
                className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                aria-busy="true"
                aria-label="Loading results"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="rounded-lg border bg-card p-12 text-center">
                <p className="text-destructive font-medium">Something went wrong</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  We could not load search results. Please try again.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    void refetch()
                  }}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && listings.length === 0 && (
              <div className="rounded-lg border bg-card p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="mt-4 font-medium text-foreground">No results found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or filters to find what you are looking for.
                </p>
              </div>
            )}

            {/* Results grid */}
            {!isLoading && !isError && listings.length > 0 && (
              <>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
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
                  <div className="mt-8">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </Container>
  )
}

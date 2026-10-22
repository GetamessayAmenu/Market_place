'use client';

import { Button } from '@marketplace/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useCategories } from '../../hooks/useCategories';
import { useSearch } from '../../hooks/useSearch';
import Container from '../Container';

import FilterPanel, { type FilterValues, OCCASION_OPTIONS, FABRIC_OPTIONS } from './FilterPanel';
import ListingCard from './ListingCard';
import ListingCardSkeleton from './ListingCardSkeleton';
import NoResultsRecovery from './NoResultsRecovery';
import SearchBar from './SearchBar';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get('q') ?? '';
  const initialPage = Number(searchParams.get('page') ?? '1');
  const initialSort = searchParams.get('sortBy') ?? 'relevance';
  const initialCategory = searchParams.get('categoryId') ?? searchParams.get('category') ?? '';
  const initialMinPrice = searchParams.get('minPrice') ?? '';
  const initialMaxPrice = searchParams.get('maxPrice') ?? '';
  const initialCity = searchParams.get('city') ?? '';
  const initialType = searchParams.get('type') ?? '';
  const initialCondition = initialType === 'rent' ? (searchParams.get('condition') ?? '') : '';

  const initialOccasions = useMemo(() => {
    const list = searchParams.getAll('occasionTypes');
    if (list.length > 0) return list;
    const single = searchParams.get('occasion');
    return single ? [single] : [];
  }, [searchParams]);

  const initialFabrics = useMemo(() => {
    const list = searchParams.getAll('fabricTypes');
    if (list.length > 0) return list;
    const single = searchParams.get('fabric');
    return single ? [single] : [];
  }, [searchParams]);

  const initialSizes = useMemo(() => {
    const list = searchParams.getAll('size');
    if (list.length > 0) return list;
    const single = searchParams.get('size');
    return single ? [single] : [];
  }, [searchParams]);

  const initialVerifiedOnly = searchParams.get('verified') === 'true';

  const [query, setQuery] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState(initialSort);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: categoriesRes } = useCategories();

  useEffect(() => {
    setQuery(initialQ);
    setPage(initialPage);
    setSortBy(initialSort);
  }, [initialQ, initialPage, initialSort]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const categoryOptions = useMemo(() => {
    const cats = categoriesRes ?? [];
    return cats.map((c) => ({
      value: c.id,
      label: c.name,
      ...(c.children && c.children.length > 0
        ? {
            children: c.children.map((child) => ({
              value: child.id,
              label: child.name,
            })),
          }
        : {}),
    }));
  }, [categoriesRes]);

  // Lookup active category label for filter badge
  const activeCategoryObj = useMemo(() => {
    if (!initialCategory || !categoriesRes) return null;
    for (const cat of categoriesRes) {
      if (cat.id === initialCategory || cat.slug === initialCategory) {
        return { id: cat.id, name: cat.name, parentName: null, parentId: null };
      }
      if (cat.children) {
        for (const child of cat.children) {
          if (child.id === initialCategory || child.slug === initialCategory) {
            return { id: child.id, name: child.name, parentName: cat.name, parentId: cat.id };
          }
        }
      }
    }
    return { id: initialCategory, name: 'Category', parentName: null, parentId: null };
  }, [initialCategory, categoriesRes]);

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
      occasionTypes: initialOccasions.length > 0 ? initialOccasions : undefined,
      fabricTypes: initialFabrics.length > 0 ? initialFabrics : undefined,
      size: initialSizes.length > 0 ? initialSizes : undefined,
      verified: initialVerifiedOnly ? true : undefined,
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
      initialType,
      initialOccasions,
      initialFabrics,
      initialSizes,
      initialVerifiedOnly,
    ],
  );

  const { data, isLoading, isError, refetch } = useSearch(searchParamsObj);

  // Context-aware Page Title
  const getPageTitle = () => {
    if (activeCategoryObj) {
      if (activeCategoryObj.parentName) {
        return `${activeCategoryObj.parentName} → ${activeCategoryObj.name}`;
      }
      return activeCategoryObj.name;
    }
    if (initialType === 'buy') {
      return query ? `Shop results for "${query}"` : 'Shop Ethiopian Fashion';
    }
    if (initialType === 'rent') {
      return query ? `Rental results for "${query}"` : 'Rent Ethiopian Fashion';
    }
    if (initialType === 'custom') {
      return query ? `Custom-order results for "${query}"` : 'Custom Ethiopian Fashion';
    }
    return query ? `All results for "${query}"` : 'All Ethiopian Fashion';
  };

  const handleSearch = useCallback((q: string, _city?: string) => {
    setQuery(q);
    setPage(1);
  }, []);

  const handleSort = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setPage(1);
  }, []);

  const handleFilterApply = useCallback(
    (values: FilterValues) => {
      const params = new URLSearchParams();
      if (query || values.query) params.set('q', query || values.query || '');
      if (values.category) params.set('categoryId', values.category);
      if (values.minPrice) params.set('minPrice', values.minPrice);
      if (values.maxPrice) params.set('maxPrice', values.maxPrice);
      if (values.city) params.set('city', values.city);
      if (values.verifiedOnly) params.set('verified', 'true');

      if (values.occasionTypes && values.occasionTypes.length > 0) {
        values.occasionTypes.forEach((occ) => params.append('occasionTypes', occ));
      }
      if (values.fabricTypes && values.fabricTypes.length > 0) {
        values.fabricTypes.forEach((fab) => params.append('fabricTypes', fab));
      }
      if (values.size && values.size.length > 0) {
        values.size.forEach((sz) => params.append('size', sz));
      }

      const typeFilter =
        values.listingTypes !== undefined
          ? values.listingTypes.length > 0
            ? values.listingTypes[0]
            : ''
          : initialType;

      if (typeFilter) {
        params.set('type', typeFilter);
      }

      // Condition is for rental products only
      if (values.condition && (typeFilter === 'rent' || values.listingTypes?.includes('rent'))) {
        params.set('condition', values.condition);
      }

      router.push(`/search?${params.toString()}`);
      setMobileDrawerOpen(false);
    },
    [query, initialType, router],
  );

  const handleFilterReset = useCallback(() => {
    setQuery('');
    setPage(1);
    router.push('/search');
  }, [router]);

  const removeFilterParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.push(`/search?${params.toString()}`);
  };

  const removeArrayFilterParam = (key: string, valueToRemove: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll(key);
    params.delete(key);
    existing.filter((v) => v !== valueToRemove).forEach((v) => params.append(key, v));
    router.push(`/search?${params.toString()}`);
  };

  // Safe listings array & pagination metrics extraction
  const listings = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

  const metaObj = (data as any)?.meta;
  const totalCount = metaObj?.total ?? listings.length;
  const totalPages = metaObj?.totalPages ?? (Math.ceil(totalCount / 12) || 1);
  const modeCounts = metaObj?.counts;
  const categoryCounts = metaObj?.categoryCounts;

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Search Header Banner */}
      <div className="bg-muted/40 border-b py-8">
        <Container>
          <div className="mx-auto max-w-3xl space-y-4">
            <h1 className="text-foreground text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
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
        {(activeCategoryObj ||
          initialType ||
          initialMinPrice ||
          initialMaxPrice ||
          initialCity ||
          (initialType === 'rent' && initialCondition) ||
          query ||
          initialOccasions.length > 0 ||
          initialFabrics.length > 0 ||
          initialVerifiedOnly ||
          initialSizes.length > 0) && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Active Filters:
            </span>

            {query && (
              <span className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 font-semibold text-white">
                <span>&quot;{query}&quot;</span>
                <button
                  type="button"
                  onClick={() => handleSearch('')}
                  className="cursor-pointer hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {initialType && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                <span>Mode: {initialType.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('type');
                    if (initialType === 'rent') {
                      params.delete('condition');
                    }
                    router.push(`/search?${params.toString()}`);
                  }}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {initialType === 'rent' && initialCondition && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                <span>
                  Condition:{' '}
                  {initialCondition
                    .replace('_', ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </span>
                <button
                  type="button"
                  onClick={() => removeFilterParam('condition')}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {initialOccasions.map((occId) => {
              const occObj = OCCASION_OPTIONS.find((o) => o.id === occId);
              return (
                <span
                  key={occId}
                  className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 font-semibold text-white"
                >
                  <span>{occObj ? `${occObj.icon} ${occObj.label}` : occId}</span>
                  <button
                    type="button"
                    onClick={() => removeArrayFilterParam('occasionTypes', occId)}
                    className="cursor-pointer font-bold hover:opacity-80"
                  >
                    ×
                  </button>
                </span>
              );
            })}

            {initialFabrics.map((fabId) => {
              const fabObj = FABRIC_OPTIONS.find((f) => f.id === fabId);
              return (
                <span
                  key={fabId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800"
                >
                  <span>🧵 {fabObj ? fabObj.label : fabId}</span>
                  <button
                    type="button"
                    onClick={() => removeArrayFilterParam('fabricTypes', fabId)}
                    className="cursor-pointer font-bold hover:opacity-80"
                  >
                    ×
                  </button>
                </span>
              );
            })}

            {initialVerifiedOnly && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                <span>✓ Verified Sellers</span>
                <button
                  type="button"
                  onClick={() => removeFilterParam('verified')}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {activeCategoryObj?.parentName && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                <span>{activeCategoryObj.parentName}</span>
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (activeCategoryObj.parentId)
                      params.set('categoryId', activeCategoryObj.parentId);
                    else params.delete('categoryId');
                    router.push(`/search?${params.toString()}`);
                  }}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {activeCategoryObj && (
              <span className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 font-semibold text-white">
                <span>{activeCategoryObj.name}</span>
                <button
                  type="button"
                  onClick={() => removeFilterParam('categoryId')}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {initialCity && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                <span>📍 {initialCity}</span>
                <button
                  type="button"
                  onClick={() => removeFilterParam('city')}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {initialMinPrice && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                <span>Min: {Number(initialMinPrice).toLocaleString()} ETB</span>
                <button
                  type="button"
                  onClick={() => removeFilterParam('minPrice')}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {initialMaxPrice && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                <span>Max: {Number(initialMaxPrice).toLocaleString()} ETB</span>
                <button
                  type="button"
                  onClick={() => removeFilterParam('maxPrice')}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            )}

            {initialSizes.map((sz) => (
              <span
                key={sz}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800"
              >
                <span>Size: {sz}</span>
                <button
                  type="button"
                  onClick={() => removeArrayFilterParam('size', sz)}
                  className="cursor-pointer font-bold hover:opacity-80"
                >
                  ×
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={handleFilterReset}
              className="ml-auto cursor-pointer text-xs font-bold text-emerald-700 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main Search Grid & Sidebar Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:col-span-1 lg:block">
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
                occasionTypes: initialOccasions,
                fabricTypes: initialFabrics,
                verifiedOnly: initialVerifiedOnly,
                size: initialSizes,
              }}
              counts={modeCounts}
              categoryCounts={categoryCounts}
              onApplyFilters={handleFilterApply}
              onResetFilters={handleFilterReset}
            />
          </div>

          {/* Results Area */}
          <div className="space-y-6 lg:col-span-3">
            {/* Control Bar: Results Count & Sort Dropdown */}
            <div className="flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="bg-background text-foreground shadow-xs hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold lg:hidden"
                >
                  <svg
                    className="h-4 w-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span>Filters</span>
                </button>

                <p className="text-muted-foreground text-sm font-semibold">
                  Showing <span className="text-foreground font-bold">{listings.length}</span> of{' '}
                  <span className="text-foreground font-bold">{totalCount}</span> listings
                </p>
              </div>

              {/* Sort By Select */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-select"
                  className="text-muted-foreground shrink-0 text-xs font-bold uppercase tracking-wider"
                >
                  Sort:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={handleSort}
                  className="border-input bg-background h-9 cursor-pointer rounded-lg border px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="border-destructive/20 bg-destructive/5 space-y-4 rounded-xl border p-8 text-center">
                <p className="text-destructive text-sm font-semibold">
                  Unable to load search results right now.
                </p>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : listings.length === 0 ? (
              <NoResultsRecovery query={query} onClearFilters={handleFilterReset} />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                  className="text-xs font-semibold"
                >
                  Previous
                </Button>

                <div className="text-muted-foreground flex items-center gap-1 px-3 text-xs font-bold">
                  Page {page} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-xs font-semibold"
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
            className="fixed bottom-6 right-6 z-40 rounded-full bg-emerald-600 p-3 text-white shadow-xl transition-all duration-200 hover:bg-emerald-700"
            aria-label="Scroll to top"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </Container>

      {/* Mobile Filters Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="backdrop-blur-xs fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="bg-background relative ml-auto h-full w-full max-w-xs space-y-4 overflow-y-auto p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-foreground text-base font-bold">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
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
                occasionTypes: initialOccasions,
                fabricTypes: initialFabrics,
                verifiedOnly: initialVerifiedOnly,
                size: initialSizes,
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
  );
}

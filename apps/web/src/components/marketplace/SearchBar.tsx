"use client"

import { cn } from '@marketplace/ui'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { apiGet } from '../../lib/api'

type SearchBarVariant = 'compact' | 'hero' | 'filter'

export interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  onSearch: (query: string, city?: string) => void
  variant?: SearchBarVariant
  isSearching?: boolean
  className?: string
}

interface SuggestionProduct {
  id: string
  title: string
  categoryName: string
  city: string | null
  primaryImageUrl?: string | null
  price?: number
}

interface CategoryContextSuggestion {
  text: string
  categoryName: string
  categoryId: string
  categorySlug: string
}

interface SuggestionsResponse {
  searchSuggestions?: string[]
  categorySuggestions?: CategoryContextSuggestion[]
  products?: SuggestionProduct[]
  popularSearches?: string[]
}

interface SelectableItem {
  type: 'suggestion' | 'category' | 'popular' | 'product' | 'view_all'
  title: string
  queryTerm?: string
  categoryId?: string
  categorySlug?: string
  productId?: string
}

const ETHIOPIAN_CITIES = [
  'All Ethiopia',
  'Addis Ababa',
  'Hawassa',
  'Bahir Dar',
  'Dire Dawa',
  'Gondar',
  'Mekelle',
  'Adama',
]

function SearchBarInner({
  defaultValue = '',
  placeholder = 'Search habesha dress, rental, designers...',
  onSearch,
  variant: _variant = 'hero',
  isSearching = false,
  className,
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeType = searchParams ? (searchParams.get('type') ?? '') : ''

  const [value, setValue] = useState(defaultValue)
  const [selectedCity, setSelectedCity] = useState('All Ethiopia')
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions(null)
      setIsOpen(false)
      return
    }
    setLoadingSuggestions(true)
    try {
      const res = await apiGet<SuggestionsResponse>('/search/suggestions', { q: q.trim(), limit: 5 })
      setSuggestions(res)
      setIsOpen(true)
      setSelectedIndex(-1)
    } catch {
      setSuggestions(null)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)

      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
      fetchTimerRef.current = setTimeout(() => {
        void fetchSuggestions(newValue)
      }, 200)
    },
    [fetchSuggestions]
  )

  const executeSearch = (q: string) => {
    setValue(q)
    setIsOpen(false)

    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (activeType) params.set('type', activeType)
    if (selectedCity && selectedCity !== 'All Ethiopia') params.set('city', selectedCity)

    onSearch(q.trim(), selectedCity === 'All Ethiopia' ? undefined : selectedCity)
    router.push(`/search?${params.toString()}`)
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)

    if (selectedIndex >= 0 && selectableItems[selectedIndex]) {
      const item = selectableItems[selectedIndex]
      if (item.type === 'suggestion' && item.queryTerm) {
        executeSearch(item.queryTerm)
      } else if (item.type === 'category' && item.categoryId) {
        setIsOpen(false)
        const cleanQ = (item.queryTerm || value).replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
        const params = new URLSearchParams()
        if (cleanQ) params.set('q', cleanQ)
        params.set('categoryId', item.categoryId)
        if (activeType) params.set('type', activeType)
        router.push(`/search?${params.toString()}`)
      } else if (item.type === 'product' && item.productId) {
        setIsOpen(false)
        router.push(`/listings/${item.productId}`)
      } else {
        executeSearch(value)
      }
    } else {
      executeSearch(value)
    }
  }

  const handleClear = () => {
    setValue('')
    setSuggestions(null)
    setIsOpen(false)
    executeSearch('')
  }

  const selectableItems = useMemo<SelectableItem[]>(() => {
    if (!suggestions) return []
    const items: SelectableItem[] = []

    ;(suggestions.searchSuggestions ?? []).forEach((term) => {
      items.push({ type: 'suggestion', title: term, queryTerm: term })
    })

    ;(suggestions.categorySuggestions ?? []).forEach((cat) => {
      const cleanText = cat.text.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
      items.push({
        type: 'category',
        title: `${cat.text} in ${cat.categoryName}`,
        queryTerm: cleanText,
        categoryId: cat.categoryId,
        categorySlug: cat.categorySlug,
      })
    })

    ;(suggestions.products ?? []).forEach((prod) => {
      items.push({
        type: 'product',
        title: prod.title,
        productId: prod.id,
      })
    })

    if (value.trim()) {
      items.push({
        type: 'view_all',
        title: `View all results for "${value.trim()}"`,
        queryTerm: value.trim(),
      })
    }

    return items
  }, [suggestions, value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || selectableItems.length === 0) {
      if (e.key === 'ArrowDown' && value.trim().length >= 2) {
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < selectableItems.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : selectableItems.length - 1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const searchTerms = suggestions?.searchSuggestions ?? []
  const catSuggestions = suggestions?.categorySuggestions ?? []
  const productSuggestions = suggestions?.products ?? []

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} role="search" className="relative flex flex-col sm:flex-row items-center gap-2 w-full">
        {/* Main Search Input + City Selector Group */}
        <div className="relative flex-1 flex items-center w-full bg-background border border-input rounded-xl shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600/50 focus-within:border-emerald-600">
          {/* Left search icon / Spinner */}
          <div className="pl-3.5 pr-1 text-muted-foreground">
            {isSearching || loadingSuggestions ? (
              <svg className="h-5 w-5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          <input
            type="search"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (value.trim().length >= 2) setIsOpen(true)
            }}
            placeholder={placeholder}
            aria-label="Search Habesha Market"
            className="w-full h-12 bg-transparent px-2 text-sm sm:text-base placeholder:text-muted-foreground/70 focus:outline-none"
          />

          {/* Clear button */}
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors mr-1"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Vertical Separator */}
          <div className="hidden sm:block h-6 w-px bg-border my-auto" />

          {/* City Location Select Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 bg-muted/30 hover:bg-muted/60 transition-colors h-12 cursor-pointer border-l">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value)
                if (value.trim()) executeSearch(value)
              }}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-4"
            >
              {ETHIOPIAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Green Search Action Button */}
        <button
          type="submit"
          className="h-12 w-full sm:w-auto px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
        >
          <span>Search</span>
        </button>
      </form>

      {/* Jiji/OLX-Style Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl ring-1 ring-black/5 animate-in fade-in-50 slide-in-from-top-1">
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[420px] overflow-y-auto">
            {/* Column 1: SEARCH SUGGESTIONS */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                Search Suggestions
              </div>
              <div className="space-y-1">
                {searchTerms.length > 0 ? (
                  searchTerms.map((term, i) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => executeSearch(term)}
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs sm:text-sm transition-colors',
                        selectedIndex === i
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'hover:bg-accent text-foreground'
                      )}
                    >
                      <svg className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="truncate">{term}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground px-2 py-1">No search suggestions</p>
                )}
              </div>
            </div>

            {/* Column 2: IN CATEGORIES */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                In Categories
              </div>
              <div className="space-y-1">
                {catSuggestions.length > 0 ? (
                  catSuggestions.map((cat) => {
                    const cleanQ = cat.text.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
                    return (
                      <button
                        key={cat.categoryId + cat.text}
                        type="button"
                        onClick={() => {
                          setIsOpen(false)
                          const params = new URLSearchParams()
                          if (cleanQ) params.set('q', cleanQ)
                          params.set('categoryId', cat.categoryId)
                          if (activeType) params.set('type', activeType)
                          router.push(`/search?${params.toString()}`)
                        }}
                        className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs sm:text-sm hover:bg-accent transition-colors"
                      >
                        <svg className="h-3.5 w-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h10" />
                        </svg>
                        <span className="truncate">
                          {cat.text} <span className="text-muted-foreground font-normal">in</span>{' '}
                          <span className="font-semibold text-emerald-600">{cat.categoryName}</span>
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <p className="text-xs text-muted-foreground px-2 py-1">No category matches</p>
                )}
              </div>
            </div>

            {/* Column 3: MATCHING PRODUCTS PREVIEW */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                Matching Products
              </div>
              <div className="space-y-1.5">
                {productSuggestions.length > 0 ? (
                  productSuggestions.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      href={`/listings/${p.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-muted/60 transition-colors group"
                    >
                      {p.primaryImageUrl ? (
                        <img src={p.primaryImageUrl} alt={p.title} className="h-9 w-9 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                          ✨
                        </div>
                      )}
                      <div className="overflow-hidden text-xs">
                        <p className="font-semibold text-foreground truncate group-hover:text-emerald-600 transition-colors">
                          {p.title}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {p.price ? `${p.price.toLocaleString()} ETB` : ''} {p.city ? `• 📍 ${p.city}` : ''}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground px-2 py-1">No product matches</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar: View All Results */}
          {value.trim() && (
            <button
              type="button"
              onClick={() => executeSearch(value)}
              className="w-full border-t bg-muted/30 px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View all results for &quot;{value.trim()}&quot;</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={
      <div className={cn('relative w-full', props.className)}>
        <div className="h-12 w-full bg-background border rounded-xl animate-pulse" />
      </div>
    }>
      <SearchBarInner {...props} />
    </Suspense>
  )
}

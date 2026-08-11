"use client"
import { Button, cn } from '@marketplace/ui'
import React, { useCallback, useState } from 'react'

import SearchBar from './SearchBar'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdvancedFilterValues {
  query?: string
  categoryId?: string
  minPrice?: string
  maxPrice?: string
  condition?: string
  city?: string
  // Transaction Model Filters
  supportsReadyMade?: boolean
  availableForRent?: boolean
  supportsCustomDesign?: boolean
  // Rental Date Range Filter
  rentalStartDate?: string
  rentalEndDate?: string
  // Geographic Hub Filter
  regionalHubId?: string
  hubType?: string
  // Cultural Facet Filters
  weavingPatterns?: string[]
  fabricTypes?: string[]
  embroideryStyles?: string[]
  occasionTypes?: string[]
  // Verified Designer Filter
  verifiedDesignerOnly?: boolean
}

export interface FilterSidebarProps {
  categories?: { value: string; label: string }[]
  conditions?: { value: string; label: string }[]
  initialValues?: AdvancedFilterValues
  onApply: (values: AdvancedFilterValues) => void
  onReset?: () => void
  className?: string
}

// Sample data - in production, fetch from API
const REGIONAL_HUBS = [
  { id: '1', name: 'Shiro Meda', nameAm: 'ሽሮ ሜዳ', type: 'sub_city', city: 'Addis Ababa' },
  { id: '2', name: 'Bole', nameAm: 'ቦሌ', type: 'sub_city', city: 'Addis Ababa' },
  { id: '3', name: 'Kazanchis', nameAm: 'ካዛቺስ', type: 'neighborhood', city: 'Addis Ababa' },
  { id: '4', name: 'Merkato', nameAm: 'መርካቶ', type: 'market_area', city: 'Addis Ababa' },
  { id: '5', name: 'Kirkos', nameAm: 'ኪሮስ', type: 'sub_city', city: 'Addis Ababa' },
  { id: '6', name: 'Hawassa', nameAm: 'ሃዋሳ', type: 'regional_hub', city: 'Hawassa' },
  { id: '7', name: 'Bahir Dar', nameAm: 'ባህር ዳር', type: 'regional_hub', city: 'Bahir Dar' },
]

const WEAVING_PATTERNS = [
  { value: 'tilf', label: 'Tilf', labelAm: 'ጥልፍ' },
  { value: 'menen', label: 'Menen', labelAm: 'መነን' },
  { value: 'saba', label: 'Saba', labelAm: 'ሳባ' },
  { value: 'kutna', label: 'Kutna', labelAm: 'ኩትና' },
  { value: 'yeberehan', label: 'Yeberehan', labelAm: 'የበርሃን' },
]

const FABRIC_TYPES = [
  { value: 'cotton', label: 'Cotton', labelAm: 'ኮቶን' },
  { value: 'silk', label: 'Silk', labelAm: 'ሲልክ' },
  { value: 'linen', label: 'Linen', labelAm: 'ሊኔን' },
  { value: 'tibeb', label: 'Tibeb', labelAm: 'ጥበብ' },
]

const EMBROIDERY_STYLES = [
  { value: 'cross_stitch', label: 'Cross Stitch', labelAm: 'ክሮስ ስቲች' },
  { value: 'chain_stitch', label: 'Chain Stitch', labelAm: 'ቻይን ስቲች' },
  { value: 'beadwork', label: 'Beadwork', labelAm: 'ቢድወርክ' },
]

const OCCASION_TYPES = [
  { value: 'wedding', label: 'Wedding/Melse', labelAm: 'ምልስ/ጋቢ' },
  { value: 'holiday', label: 'Holiday', labelAm: 'በዓለ' },
  { value: 'church', label: 'Church', labelAm: 'ቤተ ክርስቲያን' },
  { value: 'casual', label: 'Casual', labelAm: 'የቀን አለባበል' },
]

// ─── Collapsible section ──────────────────────────────────────────────────────

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        onClick={() => { setOpen(!open); }}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-foreground transition-colors hover:text-brand-gold"
        aria-expanded={open}
      >
        {title}
        <svg
          className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FilterSidebar({
  categories = [],
  conditions = [],
  initialValues = {},
  onApply,
  onReset,
  className,
}: FilterSidebarProps) {
  const [values, setValues] = useState<AdvancedFilterValues>(initialValues)

  const activeFilterCount = [
    values.query,
    values.categoryId,
    values.minPrice,
    values.maxPrice,
    values.condition,
    values.city,
    values.supportsReadyMade,
    values.availableForRent,
    values.supportsCustomDesign,
    values.rentalStartDate,
    values.rentalEndDate,
    values.regionalHubId,
    values.hubType,
    values.verifiedDesignerOnly,
    ...(values.weavingPatterns ?? []),
    ...(values.fabricTypes ?? []),
    ...(values.embroideryStyles ?? []),
    ...(values.occasionTypes ?? []),
  ].filter(Boolean).length

  const updateValue = useCallback(<K extends keyof AdvancedFilterValues>(key: K, val: AdvancedFilterValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }, [])

  const toggleArrayValue = useCallback((key: 'weavingPatterns' | 'fabricTypes' | 'embroideryStyles' | 'occasionTypes', val: string) => {
    setValues((prev) => {
      const arr = prev[key] ?? []
      const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
      return { ...prev, [key]: next }
    })
  }, [])

  const handleReset = () => {
    setValues({})
    onReset?.()
  }

  return (
    <div
      className={cn('space-y-0 rounded-xl border bg-card', className)}
      aria-label="Advanced Filters"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-semibold text-card-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-gold px-1.5 text-[10px] font-bold text-brand-gold-foreground">
              {String(activeFilterCount)}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="px-4">
        {/* Search */}
        <FilterSection title="Search">
          <SearchBar
            variant="filter"
            defaultValue={values.query ?? ''}
            placeholder="Search fashions..."
            onSearch={(q) => { updateValue('query', q || undefined) }}
          />
        </FilterSection>

        {/* Transaction Model Pills */}
        <FilterSection title="Transaction Model">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { updateValue('supportsReadyMade', !values.supportsReadyMade) }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                values.supportsReadyMade
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              )}
            >
              Ready-Made For Sale
            </button>
            <button
              type="button"
              onClick={() => { updateValue('availableForRent', !values.availableForRent) }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                values.availableForRent
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              )}
            >
              Fashion Rentals
            </button>
            <button
              type="button"
              onClick={() => { updateValue('supportsCustomDesign', !values.supportsCustomDesign) }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                values.supportsCustomDesign
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              )}
            >
              Custom-Made Available
            </button>
          </div>
        </FilterSection>

        {/* Rental Date Range Picker */}
        <FilterSection title="Rental Date Range" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <label htmlFor="rental-start-date" className="mb-1 block text-xs text-muted-foreground">Start Date</label>
              <input
                id="rental-start-date"
                type="date"
                value={values.rentalStartDate ?? ''}
                onChange={(e) => { updateValue('rentalStartDate', e.target.value || undefined) }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
              />
            </div>
            <div>
              <label htmlFor="rental-end-date" className="mb-1 block text-xs text-muted-foreground">End Date</label>
              <input
                id="rental-end-date"
                type="date"
                value={values.rentalEndDate ?? ''}
                onChange={(e) => { updateValue('rentalEndDate', e.target.value || undefined) }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Filter items available during your event date (e.g., Timket, Meskel)
            </p>
          </div>
        </FilterSection>

        {/* Category */}
        {categories.length > 0 && (
          <FilterSection title="Category">
            <select
              value={values.categoryId ?? ''}
              onChange={(e) => { updateValue('categoryId', e.target.value || undefined) }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </FilterSection>
        )}

        {/* Price Range */}
        <FilterSection title="Price Range">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-min-price" className="mb-1 block text-xs text-muted-foreground">Min (ETB)</label>
              <input
                id="filter-min-price"
                type="number"
                min="0"
                placeholder="0"
                value={values.minPrice ?? ''}
                onChange={(e) => { updateValue('minPrice', e.target.value || undefined) }}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
              />
            </div>
            <div>
              <label htmlFor="filter-max-price" className="mb-1 block text-xs text-muted-foreground">Max (ETB)</label>
              <input
                id="filter-max-price"
                type="number"
                min="0"
                placeholder="Any"
                value={values.maxPrice ?? ''}
                onChange={(e) => { updateValue('maxPrice', e.target.value || undefined) }}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
              />
            </div>
          </div>
        </FilterSection>

        {/* Geographic Sub-City Checkboxes */}
        <FilterSection title="📍 Geographic Hubs" defaultOpen={false}>
          <div className="space-y-2">
            <div className="mb-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Addis Ababa Sub-Cities</label>
              <div className="space-y-1">
                {REGIONAL_HUBS.filter(h => h.city === 'Addis Ababa' && h.type === 'sub_city').map((hub) => (
                  <label key={hub.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.regionalHubId === hub.id}
                      onChange={(e) => { updateValue('regionalHubId', e.target.checked ? hub.id : undefined) }}
                      className="h-4 w-4 border-border text-brand-gold focus:ring-brand-gold/50"
                    />
                    <span className="text-sm text-foreground">{hub.name} <span className="text-muted-foreground">({hub.nameAm})</span></span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Regional Hubs</label>
              <div className="space-y-1">
                {REGIONAL_HUBS.filter(h => h.type === 'regional_hub').map((hub) => (
                  <label key={hub.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.regionalHubId === hub.id}
                      onChange={(e) => { updateValue('regionalHubId', e.target.checked ? hub.id : undefined) }}
                      className="h-4 w-4 border-border text-brand-gold focus:ring-brand-gold/50"
                    />
                    <span className="text-sm text-foreground">{hub.name} <span className="text-muted-foreground">({hub.nameAm})</span></span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Cultural Facet Filters */}
        <FilterSection title="🧵 Traditional Weaving Patterns" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {WEAVING_PATTERNS.map((pattern) => {
              const isActive = (values.weavingPatterns ?? []).includes(pattern.value)
              return (
                <button
                  key={pattern.value}
                  type="button"
                  onClick={() => { toggleArrayValue('weavingPatterns', pattern.value) }}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
                    isActive
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                      : 'border-input bg-background text-muted-foreground hover:border-foreground/30'
                  )}
                >
                  {pattern.label} <span className="text-muted-foreground">({pattern.labelAm})</span>
                </button>
              )
            })}
          </div>
        </FilterSection>

        <FilterSection title="🎨 Fabric Types" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {FABRIC_TYPES.map((fabric) => {
              const isActive = (values.fabricTypes ?? []).includes(fabric.value)
              return (
                <button
                  key={fabric.value}
                  type="button"
                  onClick={() => { toggleArrayValue('fabricTypes', fabric.value) }}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
                    isActive
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                      : 'border-input bg-background text-muted-foreground hover:border-foreground/30'
                  )}
                >
                  {fabric.label} <span className="text-muted-foreground">({fabric.labelAm})</span>
                </button>
              )
            })}
          </div>
        </FilterSection>

        <FilterSection title="🪡 Embroidery Styles" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {EMBROIDERY_STYLES.map((style) => {
              const isActive = (values.embroideryStyles ?? []).includes(style.value)
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => { toggleArrayValue('embroideryStyles', style.value) }}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
                    isActive
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                      : 'border-input bg-background text-muted-foreground hover:border-foreground/30'
                  )}
                >
                  {style.label} <span className="text-muted-foreground">({style.labelAm})</span>
                </button>
              )
            })}
          </div>
        </FilterSection>

        <FilterSection title="🎉 Occasion Types" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {OCCASION_TYPES.map((occasion) => {
              const isActive = (values.occasionTypes ?? []).includes(occasion.value)
              return (
                <button
                  key={occasion.value}
                  type="button"
                  onClick={() => { toggleArrayValue('occasionTypes', occasion.value) }}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
                    isActive
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                      : 'border-input bg-background text-muted-foreground hover:border-foreground/30'
                  )}
                >
                  {occasion.label} <span className="text-muted-foreground">({occasion.labelAm})</span>
                </button>
              )
            })}
          </div>
        </FilterSection>

        {/* Verified Designer Toggle */}
        <FilterSection title="Verified Designers" defaultOpen={false}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.verifiedDesignerOnly || false}
              onChange={(e) => { updateValue('verifiedDesignerOnly', e.target.checked) }}
              className="h-4 w-4 border-border text-brand-gold focus:ring-brand-gold/50"
            />
            <span className="text-sm text-foreground">Show only verified designers / authentic Habesha sellers</span>
          </label>
        </FilterSection>

        {/* Condition */}
        {conditions.length > 0 && (
          <FilterSection title="Condition" defaultOpen={false}>
            <select
              value={values.condition ?? ''}
              onChange={(e) => { updateValue('condition', e.target.value || undefined) }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
            >
              <option value="">Any condition</option>
              {conditions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </FilterSection>
        )}
      </div>

      {/* Apply button */}
      <div className="flex gap-2 border-t border-border/50 px-4 py-3">
        <Button onClick={() => { onApply(values) }} className="flex-1">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}

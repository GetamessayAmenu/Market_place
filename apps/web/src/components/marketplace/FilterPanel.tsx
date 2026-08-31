"use client"

import { cn } from '@marketplace/ui'
import React, { useState } from 'react'

export interface FilterValues {
  query?: string | undefined
  category?: string | undefined
  condition?: string | undefined
  minPrice?: string | undefined
  maxPrice?: string | undefined
  listingTypes?: ('buy' | 'rent' | 'custom')[] | undefined
  city?: string | undefined
  size?: string[] | undefined
  color?: string[] | undefined
}

export interface FilterPanelProps {
  categoryOptions: { value: string; label: string; children?: { value: string; label: string }[] }[]
  conditionOptions?: { value: string; label: string }[]
  initialValues?: FilterValues
  counts?: { buy?: number; rent?: number; custom?: number }
  onApplyFilters: (values: FilterValues) => void
  onResetFilters: () => void
  className?: string
}

const PRESET_PRICE_RANGES = [
  { label: 'Under 2,000', min: '', max: '2000' },
  { label: '2,000 – 5,000', min: '2000', max: '5000' },
  { label: '5,000 – 10,000', min: '5000', max: '10000' },
  { label: '10,000+', min: '10000', max: '' },
]

const COLOR_SWATCHES = [
  { name: 'Black', color: '#000000' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Orange', color: '#F97316' },
  { name: 'Green', color: '#10B981' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Purple', color: '#8B5CF6' },
]

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL']

const CITIES = ['Addis Ababa', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Gondar']

export default function FilterPanel({
  categoryOptions,
  conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
  ],
  initialValues,
  counts,
  onApplyFilters,
  onResetFilters,
  className,
}: FilterPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialValues?.category ?? '')
  const [selectedCondition, setSelectedCondition] = useState(initialValues?.condition ?? '')
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice ?? '')
  const [selectedTypes, setSelectedTypes] = useState<('buy' | 'rent' | 'custom')[]>(initialValues?.listingTypes ?? [])
  const [city, setCity] = useState(initialValues?.city ?? 'Addis Ababa')
  const [allEthiopia, setAllEthiopia] = useState(!initialValues?.city)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialValues?.size ?? [])
  const [selectedColors, setSelectedColors] = useState<string[]>(initialValues?.color ?? [])
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})

  const handleTypeToggle = (type: 'buy' | 'rent' | 'custom') => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [type]
    setSelectedTypes(next)
    onApplyFilters({
      category: selectedCategory,
      condition: selectedCondition,
      minPrice,
      maxPrice,
      listingTypes: next,
      city: allEthiopia ? undefined : city,
      size: selectedSizes,
      color: selectedColors,
    })
  }

  const handleCategorySelect = (catId: string) => {
    const nextCat = selectedCategory === catId ? '' : catId
    setSelectedCategory(nextCat)
    onApplyFilters({
      category: nextCat,
      condition: selectedCondition,
      minPrice,
      maxPrice,
      listingTypes: selectedTypes,
      city: allEthiopia ? undefined : city,
      size: selectedSizes,
      color: selectedColors,
    })
  }

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  const handlePricePreset = (presetMin: string, presetMax: string) => {
    setMinPrice(presetMin)
    setMaxPrice(presetMax)
    onApplyFilters({
      category: selectedCategory,
      condition: selectedCondition,
      minPrice: presetMin,
      maxPrice: presetMax,
      listingTypes: selectedTypes,
      city: allEthiopia ? undefined : city,
      size: selectedSizes,
      color: selectedColors,
    })
  }

  const handleReset = () => {
    setSelectedCategory('')
    setSelectedCondition('')
    setMinPrice('')
    setMaxPrice('')
    setSelectedTypes([])
    setCity('Addis Ababa')
    setAllEthiopia(true)
    setSelectedSizes([])
    setSelectedColors([])
    onResetFilters()
  }

  return (
    <aside className={cn('w-full space-y-6 rounded-xl border bg-card p-5 text-card-foreground shadow-xs', className)}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="font-bold text-foreground text-base">Filters</h2>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Product Type Section */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Type</h3>
        <div className="space-y-1.5">
          <label className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/40 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selectedTypes.includes('buy')}
                onChange={() => handleTypeToggle('buy')}
                className="h-4 w-4 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Buy</span>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {counts?.buy !== undefined ? counts.buy : 18}
            </span>
          </label>

          <label className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/40 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selectedTypes.includes('rent')}
                onChange={() => handleTypeToggle('rent')}
                className="h-4 w-4 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Rent</span>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {counts?.rent !== undefined ? counts.rent : 8}
            </span>
          </label>

          <label className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/40 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selectedTypes.includes('custom')}
                onChange={() => handleTypeToggle('custom')}
                className="h-4 w-4 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Custom Order</span>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {counts?.custom !== undefined ? counts.custom : 11}
            </span>
          </label>
        </div>
      </div>

      {/* Category Section with Expandable Tree */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</h3>
        <div className="space-y-1">
          {categoryOptions.map((cat) => {
            const isSelected = selectedCategory === cat.value
            const hasChildren = Boolean(cat.children && cat.children.length > 0)
            const isExpanded = expandedCats[cat.value] ?? isSelected

            return (
              <div key={cat.value} className="space-y-1">
                <div
                  onClick={() => handleCategorySelect(cat.value)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                      : 'hover:bg-muted text-foreground/80'
                  )}
                >
                  <span className="truncate">{cat.label}</span>

                  {hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(cat.value, e)}
                      className="p-1 text-muted-foreground/70 hover:text-emerald-700 transition-transform"
                    >
                      <svg
                        className={cn('h-4 w-4 transition-transform duration-200', isExpanded ? 'rotate-90' : '')}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Subcategories Child Tree */}
                {hasChildren && isExpanded && (
                  <div className="pl-4 space-y-1 border-l-2 border-emerald-100 my-1 ml-2">
                    {cat.children!.map((child) => {
                      const isChildSelected = selectedCategory === child.value
                      return (
                        <button
                          key={child.value}
                          type="button"
                          onClick={() => handleCategorySelect(child.value)}
                          className={cn(
                            'w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                            isChildSelected
                              ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                              : 'hover:bg-muted/70 text-foreground/70'
                          )}
                        >
                          <span className="truncate">{child.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Price Range (ETB) Section */}
      <div className="space-y-3 border-t pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range (ETB)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Quick Range Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_PRICE_RANGES.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePricePreset(p.min, p.max)}
              className="rounded-lg border bg-muted/30 px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</h3>
        <select
          value={city}
          disabled={allEthiopia}
          onChange={(e) => {
            setCity(e.target.value)
            onApplyFilters({
              category: selectedCategory,
              condition: selectedCondition,
              minPrice,
              maxPrice,
              listingTypes: selectedTypes,
              city: e.target.value,
              size: selectedSizes,
              color: selectedColors,
            })
          }}
          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={allEthiopia}
            onChange={(e) => {
              setAllEthiopia(e.target.checked)
              onApplyFilters({
                category: selectedCategory,
                condition: selectedCondition,
                minPrice,
                maxPrice,
                listingTypes: selectedTypes,
                city: e.target.checked ? undefined : city,
                size: selectedSizes,
                color: selectedColors,
              })
            }}
            className="h-3.5 w-3.5 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
          />
          <span>All Ethiopia</span>
        </label>
      </div>

      {/* Size Section */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Size</h3>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_OPTIONS.map((sz) => {
            const isSelected = selectedSizes.includes(sz)
            return (
              <button
                key={sz}
                type="button"
                onClick={() => {
                  const next = isSelected ? selectedSizes.filter((s) => s !== sz) : [...selectedSizes, sz]
                  setSelectedSizes(next)
                }}
                className={cn(
                  'h-8 w-9 rounded-lg border text-xs font-bold transition-colors',
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-background hover:bg-muted text-foreground'
                )}
              >
                {sz}
              </button>
            )
          })}
        </div>
      </div>

      {/* Color Section */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color</h3>
        <div className="flex items-center gap-2">
          {COLOR_SWATCHES.map((sw) => (
            <button
              key={sw.name}
              type="button"
              onClick={() => {
                const isSel = selectedColors.includes(sw.name)
                const next = isSel ? selectedColors.filter((c) => c !== sw.name) : [...selectedColors, sw.name]
                setSelectedColors(next)
              }}
              title={sw.name}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                selectedColors.includes(sw.name) ? 'ring-2 ring-emerald-600 ring-offset-2' : 'border-white shadow-xs'
              )}
              style={{ backgroundColor: sw.color }}
            />
          ))}
        </div>
      </div>

      {/* Condition Section */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Condition</h3>
        <div className="space-y-1">
          {conditionOptions.map((c) => (
            <label key={c.value} className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer py-1">
              <input
                type="radio"
                name="condition"
                checked={selectedCondition === c.value}
                onChange={() => {
                  setSelectedCondition(c.value)
                  onApplyFilters({
                    category: selectedCategory,
                    condition: c.value,
                    minPrice,
                    maxPrice,
                    listingTypes: selectedTypes,
                    city: allEthiopia ? undefined : city,
                    size: selectedSizes,
                    color: selectedColors,
                  })
                }}
                className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  )
}

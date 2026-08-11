"use client"
import { Button, RadioGroup, Tag, cn, type RadioOption } from '@marketplace/ui';
import React, { useCallback, useState } from 'react';

import SearchBar from './SearchBar';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListingTypeFilter = 'buy' | 'rent' | 'custom';

export interface FilterValues {
  query?: string;
  listingTypes?: ListingTypeFilter[];
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sizes?: string[];
  colors?: string[];
  designer?: string;
  condition?: string;
  city?: string;
  sortBy?: string;
  // Unified custom design filters
  capabilityFilter?: 'ready-made' | 'custom-design' | 'both';
}

export interface FilterPanelProps {
  categories?: { value: string; label: string; children?: { value: string; label: string }[] }[];
  conditions?: { value: string; label: string }[];
  cities?: { value: string; label: string }[];
  designers?: { value: string; label: string }[];
  sizes?: string[];
  colors?: { value: string; label: string; hex?: string }[];
  initialValues?: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset?: () => void;
  className?: string;
}

const LISTING_TYPE_OPTIONS: { value: ListingTypeFilter; label: string; variant: 'buy' | 'rent' | 'custom' }[] = [
  { value: 'buy', label: 'Buy', variant: 'buy' },
  { value: 'rent', label: 'Rent', variant: 'rent' },
  { value: 'custom', label: 'Custom', variant: 'custom' },
];

const SORT_OPTIONS: RadioOption[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

// ─── Collapsible section ──────────────────────────────────────────────────────

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

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

export default function FilterPanel({
  categories = [],
  conditions = [],
  cities = [],
  designers = [],
  sizes = [],
  colors = [],
  initialValues = {},
  onApply,
  onReset,
  className,
}: FilterPanelProps) {
  const [values, setValues] = useState<FilterValues>(initialValues);

  const activeFilterCount = [
    values.query,
    values.category,
    values.minPrice,
    values.maxPrice,
    values.condition,
    values.city,
    values.designer,
    ...(values.listingTypes ?? []),
    ...(values.sizes ?? []),
    ...(values.colors ?? []),
  ].filter(Boolean).length;

  const updateValue = useCallback(<K extends keyof FilterValues>(key: K, val: FilterValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const toggleArrayValue = useCallback((key: 'listingTypes' | 'sizes' | 'colors', val: string) => {
    setValues((prev) => {
      const arr = prev[key] ?? [];
      const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleReset = () => {
    setValues({});
    onReset?.();
  };

  return (
    <div
      className={cn('space-y-0 rounded-xl border bg-card', className)}
      aria-label="Filters"
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
        {/* Product Type - Jiji Style (For Sale, Rent, Custom Order) */}
        <FilterSection title="Product Type" defaultOpen={true}>
          <div className="flex flex-col gap-2">
            {LISTING_TYPE_OPTIONS.map((opt) => {
              const isActive = (values.listingTypes ?? []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { 
                    // Clear other types and select this one (single selection like Jiji)
                    setValues(prev => ({ ...prev, listingTypes: [opt.value] }));
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all',
                    isActive
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold font-medium'
                      : 'border-border bg-background text-foreground hover:border-brand-gold/50 hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                    isActive ? 'border-brand-gold' : 'border-border'
                  )}>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-brand-gold" />
                    )}
                  </div>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Search */}
        <FilterSection title="Search">
          <SearchBar
            variant="filter"
            defaultValue={values.query ?? ''}
            placeholder="Search fashions..."
            onSearch={(q) => { updateValue('query', q || undefined); }}
          />
        </FilterSection>


        {/* Category - Jiji Style with Parent Categories */}
        {categories.length > 0 && (
          <FilterSection title="Category" defaultOpen={true}>
            {/* Parent Categories */}
            <div className="space-y-3 mb-4">
              {categories
                .filter(c => ['Women\'s Fashion', 'Men\'s Fashion', 'Baby & Kids Fashion'].includes(c.label))
                .map((parentCat) => (
                  <div key={parentCat.value} className="border border-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { updateValue('category', parentCat.value); }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors',
                        values.category === parentCat.value
                          ? 'bg-brand-gold/10 text-brand-gold'
                          : 'bg-background text-foreground hover:bg-muted'
                      )}
                    >
                      <span>{parentCat.label}</span>
                      {values.category === parentCat.value && (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    {/* Subcategories dropdown */}
                    {values.category === parentCat.value && parentCat.children && parentCat.children.length > 0 && (
                      <div className="border-t border-border bg-muted/30">
                        <select
                          value={values.category === parentCat.value ? '' : values.category}
                          onChange={(e) => { updateValue('category', e.target.value || parentCat.value); }}
                          className="w-full px-3 py-2 text-sm bg-transparent focus-visible:outline-none"
                        >
                          <option value="">All {parentCat.label}</option>
                          {parentCat.children.map((child) => (
                            <option key={child.value} value={child.value} className="pl-4">
                              {child.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            
            {/* Other Categories */}
            <div className="pt-3 border-t border-border">
              <select
                value={categories.some(c => ['Women\'s Fashion', 'Men\'s Fashion', 'Baby & Kids Fashion'].includes(c.label) && values.category === c.value) 
                  ? '' 
                  : values.category ?? ''}
                onChange={(e) => { updateValue('category', e.target.value || undefined); }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
              >
                <option value="">Other categories</option>
                {categories
                  .filter(c => !['Women\'s Fashion', 'Men\'s Fashion', 'Baby & Kids Fashion'].includes(c.label))
                  .map((c) => (
                    <React.Fragment key={c.value}>
                      <option value={c.value}>{c.label}</option>
                      {c.children && c.children.length > 0 && c.children.map((child) => (
                        <option key={child.value} value={child.value} className="pl-6">
                          &nbsp;&nbsp;{child.label}
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
              </select>
            </div>
          </FilterSection>
        )}

        {/* Price range */}
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
                onChange={(e) => { updateValue('minPrice', e.target.value || undefined); }}
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
                onChange={(e) => { updateValue('maxPrice', e.target.value || undefined); }}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
              />
            </div>
          </div>
        </FilterSection>

        {/* Sizes */}
        {sizes.length > 0 && (
          <FilterSection title="Size" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const isActive = (values.sizes ?? []).includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => { toggleArrayValue('sizes', size); }}
                    className={cn(
                      'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                      isActive
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                        : 'border-input bg-background text-muted-foreground hover:border-foreground/30'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Colors */}
        {colors.length > 0 && (
          <FilterSection title="Color" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const isActive = (values.colors ?? []).includes(color.value);
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => { toggleArrayValue('colors', color.value); }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                      isActive
                        ? 'border-brand-gold bg-brand-gold/5'
                        : 'border-transparent bg-muted/50 hover:bg-muted'
                    )}
                  >
                    {color.hex && (
                      <span
                        className="h-3 w-3 rounded-full ring-1 ring-inset ring-border"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden="true"
                      />
                    )}
                    {color.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Designer */}
        {designers.length > 0 && (
          <FilterSection title="Designer" defaultOpen={false}>
            <select
              value={values.designer ?? ''}
              onChange={(e) => { updateValue('designer', e.target.value || undefined); }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
            >
              <option value="">All designers</option>
              {designers.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </FilterSection>
        )}

        {/* Condition */}
        {conditions.length > 0 && (
          <FilterSection title="Condition" defaultOpen={false}>
            <select
              value={values.condition ?? ''}
              onChange={(e) => { updateValue('condition', e.target.value || undefined); }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
            >
              <option value="">Any condition</option>
              {conditions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </FilterSection>
        )}

        {/* City/Location */}
        <FilterSection title="Location" defaultOpen={true}>
          <select
            value={values.city ?? ''}
            onChange={(e) => { updateValue('city', e.target.value || undefined); }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
          >
            <option value="">All locations</option>
            {cities.length > 0 ? (
              cities.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))
            ) : (
              // Default Ethiopian cities if none provided
              <>
                <option value="Addis Ababa">Addis Ababa</option>
                <option value="Bahir Dar">Bahir Dar</option>
                <option value="Hawassa">Hawassa</option>
                <option value="Mekelle">Mekelle</option>
                <option value="Dire Dawa">Dire Dawa</option>
                <option value="Adama">Adama</option>
                <option value="Gondar">Gondar</option>
                <option value="Jimma">Jimma</option>
              </>
            )}
          </select>
        </FilterSection>

        {/* Sort */}
        <FilterSection title="Sort By">
          <RadioGroup
            name="filter-sort"
            options={SORT_OPTIONS}
            value={values.sortBy ?? 'relevance'}
            onChange={(val) => { updateValue('sortBy', val); }}
            orientation="vertical"
          />
        </FilterSection>
      </div>

      {/* Apply button */}
      <div className="flex gap-2 border-t border-border/50 px-4 py-3">
        <Button onClick={() => { onApply(values); }} className="flex-1">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

// ─── Active Filter Pills ──────────────────────────────────────────────────────

export function ActiveFilterPills({
  values,
  onRemove,
  onClearAll,
}: {
  values: FilterValues;
  onRemove: (key: keyof FilterValues, value?: string) => void;
  onClearAll: () => void;
}) {
  const pills: { key: keyof FilterValues; label: string; value?: string }[] = [];

  if (values.query) pills.push({ key: 'query', label: '"' + values.query + '"' });
  if (values.category) pills.push({ key: 'category', label: values.category });
  (values.listingTypes ?? []).forEach((t) => { pills.push({ key: 'listingTypes', label: t.charAt(0).toUpperCase() + t.slice(1), value: t }); });
  (values.sizes ?? []).forEach((s) => { pills.push({ key: 'sizes', label: 'Size: ' + s, value: s }); });
  (values.colors ?? []).forEach((c) => { pills.push({ key: 'colors', label: c, value: c }); });
  if (values.minPrice || values.maxPrice) {
    const label = values.minPrice && values.maxPrice
      ? values.minPrice + ' – ' + values.maxPrice + ' ETB'
      : values.minPrice ? 'From ' + values.minPrice + ' ETB'
      : 'Up to ' + (values.maxPrice ?? '') + ' ETB';
    pills.push({ key: 'minPrice', label });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Active filters">
      {pills.map((pill, i) => (
        <Tag
          key={String(i)}
          size="sm"
          onRemove={() => { onRemove(pill.key, pill.value); }}
        >
          {pill.label}
        </Tag>
      ))}
      {pills.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

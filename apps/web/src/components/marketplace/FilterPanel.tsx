'use client';

import { cn } from '@marketplace/ui';
import React, { useState } from 'react';

export interface FilterValues {
  query?: string | undefined;
  category?: string | undefined;
  condition?: string | undefined;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  listingTypes?: ('buy' | 'rent' | 'custom')[] | undefined;
  city?: string | undefined;
  size?: string[] | undefined;
  color?: string[] | undefined; // kept optional for backward compatibility
  occasionTypes?: string[] | undefined;
  fabricTypes?: string[] | undefined;
  verifiedOnly?: boolean | undefined;
}

export interface FilterPanelProps {
  categoryOptions: {
    value: string;
    label: string;
    children?: { value: string; label: string }[];
  }[];
  conditionOptions?: { value: string; label: string }[];
  initialValues?: FilterValues;
  counts?: { buy?: number; rent?: number; custom?: number };
  categoryCounts?: Record<string, number>;
  onApplyFilters: (values: FilterValues) => void;
  onResetFilters: () => void;
  className?: string;
}

import { OCCASION_OPTIONS } from '@marketplace/types';
export { OCCASION_OPTIONS };

export const FABRIC_OPTIONS = [
  { id: 'cotton', label: 'Cotton / Shemma', labelAm: 'የሸማ / ጥጥ' },
  { id: 'menen', label: 'Menen', labelAm: 'መነን' },
  { id: 'saba', label: 'Saba / Kutna', labelAm: 'ሳባ / ኩትና' },
  { id: 'silk', label: 'Silk / Chiffon', labelAm: 'ሲልክ / ሺፎን' },
  { id: 'tilf', label: 'Hand Embroidered (Tilf)', labelAm: 'የእጅ ጥልፍ' },
];

const PRESET_PRICE_RANGES = [
  { label: 'Under 2,000', min: '', max: '2000' },
  { label: '2,000 – 5,000', min: '2000', max: '5000' },
  { label: '5,000 – 10,000', min: '5000', max: '10000' },
  { label: '10,000+', min: '10000', max: '' },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL'];

const CITIES = ['Addis Ababa', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Gondar'];

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
  categoryCounts,
  onApplyFilters,
  onResetFilters,
  className,
}: FilterPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialValues?.category ?? '');
  const [selectedCondition, setSelectedCondition] = useState(initialValues?.condition ?? '');
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice ?? '');
  const [selectedTypes, setSelectedTypes] = useState<('buy' | 'rent' | 'custom')[]>(
    initialValues?.listingTypes ?? [],
  );
  const [city, setCity] = useState(initialValues?.city ?? 'Addis Ababa');
  const [allEthiopia, setAllEthiopia] = useState(!initialValues?.city);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialValues?.size ?? []);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    initialValues?.occasionTypes ?? [],
  );
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>(
    initialValues?.fabricTypes ?? [],
  );
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(Boolean(initialValues?.verifiedOnly));
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [isOccasionExpanded, setIsOccasionExpanded] = useState<boolean>(true);
  const [isFabricExpanded, setIsFabricExpanded] = useState<boolean>(
    Boolean(initialValues?.fabricTypes?.length),
  );

  // Keep local state in sync when initialValues prop changes
  React.useEffect(() => {
    if (initialValues?.category !== undefined) setSelectedCategory(initialValues.category);
    if (initialValues?.condition !== undefined) setSelectedCondition(initialValues.condition);
    if (initialValues?.minPrice !== undefined) setMinPrice(initialValues.minPrice);
    if (initialValues?.maxPrice !== undefined) setMaxPrice(initialValues.maxPrice);
    if (initialValues?.listingTypes !== undefined) setSelectedTypes(initialValues.listingTypes);
    if (initialValues?.city !== undefined) {
      setCity(initialValues.city || 'Addis Ababa');
      setAllEthiopia(!initialValues.city);
    }
    if (initialValues?.size !== undefined) setSelectedSizes(initialValues.size);
    if (initialValues?.occasionTypes !== undefined) {
      setSelectedOccasions(initialValues.occasionTypes);
      if (initialValues.occasionTypes.length > 0) setIsOccasionExpanded(true);
    }
    if (initialValues?.fabricTypes !== undefined) {
      setSelectedFabrics(initialValues.fabricTypes);
      if (initialValues.fabricTypes.length > 0) setIsFabricExpanded(true);
    }
    if (initialValues?.verifiedOnly !== undefined)
      setVerifiedOnly(Boolean(initialValues.verifiedOnly));
  }, [initialValues]);

  const apply = (changes: Partial<FilterValues> = {}) => {
    const updated: FilterValues = {
      category: changes.category !== undefined ? changes.category : selectedCategory,
      condition: changes.condition !== undefined ? changes.condition : selectedCondition,
      minPrice: changes.minPrice !== undefined ? changes.minPrice : minPrice,
      maxPrice: changes.maxPrice !== undefined ? changes.maxPrice : maxPrice,
      listingTypes: changes.listingTypes !== undefined ? changes.listingTypes : selectedTypes,
      city: changes.city !== undefined ? changes.city : allEthiopia ? undefined : city,
      size: changes.size !== undefined ? changes.size : selectedSizes,
      occasionTypes:
        changes.occasionTypes !== undefined ? changes.occasionTypes : selectedOccasions,
      fabricTypes: changes.fabricTypes !== undefined ? changes.fabricTypes : selectedFabrics,
      verifiedOnly: changes.verifiedOnly !== undefined ? changes.verifiedOnly : verifiedOnly,
    };
    onApplyFilters(updated);
  };

  const isRentalActive = selectedTypes.includes('rent');

  const handleTypeToggle = (type: 'buy' | 'rent' | 'custom') => {
    const next = selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [type];
    setSelectedTypes(next);

    // Condition is for rental products only; clear condition if rent is no longer active
    const nextCondition = next.includes('rent') ? selectedCondition : '';
    if (!next.includes('rent') && selectedCondition) {
      setSelectedCondition('');
    }

    apply({ listingTypes: next, condition: nextCondition });
  };

  const handleCategorySelect = (catId: string) => {
    const nextCat = selectedCategory === catId ? '' : catId;
    setSelectedCategory(nextCat);
    apply({ category: nextCat });
  };

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handlePricePreset = (presetMin: string, presetMax: string) => {
    setMinPrice(presetMin);
    setMaxPrice(presetMax);
    apply({ minPrice: presetMin, maxPrice: presetMax });
  };

  const handlePriceChange = (minVal: string, maxVal: string) => {
    setMinPrice(minVal);
    setMaxPrice(maxVal);
    apply({ minPrice: minVal, maxPrice: maxVal });
  };

  const handleOccasionToggle = (occId: string) => {
    const next = selectedOccasions.includes(occId)
      ? selectedOccasions.filter((o) => o !== occId)
      : [...selectedOccasions, occId];
    setSelectedOccasions(next);
    apply({ occasionTypes: next });
  };

  const handleFabricToggle = (fabId: string) => {
    const next = selectedFabrics.includes(fabId)
      ? selectedFabrics.filter((f) => f !== fabId)
      : [...selectedFabrics, fabId];
    setSelectedFabrics(next);
    apply({ fabricTypes: next });
  };

  const handleVerifiedToggle = (checked: boolean) => {
    setVerifiedOnly(checked);
    apply({ verifiedOnly: checked });
  };

  const handleSizeToggle = (sz: string) => {
    const next = selectedSizes.includes(sz)
      ? selectedSizes.filter((s) => s !== sz)
      : [...selectedSizes, sz];
    setSelectedSizes(next);
    apply({ size: next });
  };

  const handleConditionSelect = (cVal: string) => {
    const next = selectedCondition === cVal ? '' : cVal;
    setSelectedCondition(next);
    apply({ condition: next });
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedCondition('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedTypes([]);
    setCity('Addis Ababa');
    setAllEthiopia(true);
    setSelectedSizes([]);
    setSelectedOccasions([]);
    setSelectedFabrics([]);
    setVerifiedOnly(false);
    setIsOccasionExpanded(true);
    onResetFilters();
  };

  const activeCount = [
    selectedCategory,
    isRentalActive && selectedCondition,
    minPrice,
    maxPrice,
    selectedTypes.length > 0,
    !allEthiopia,
    selectedSizes.length > 0,
    selectedOccasions.length > 0,
    selectedFabrics.length > 0,
    verifiedOnly,
  ].filter(Boolean).length;

  return (
    <aside
      className={cn(
        'bg-card text-card-foreground shadow-xs w-full space-y-6 rounded-xl border p-5',
        className,
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-bold">Filters</h2>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="cursor-pointer text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Product Type Section */}
      <div className="space-y-2.5">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
          Product Type
        </h3>
        <div className="space-y-1.5">
          <label className="hover:bg-muted/40 flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selectedTypes.includes('buy')}
                onChange={() => handleTypeToggle('buy')}
                className="h-4 w-4 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Buy</span>
            </div>
            <span className="text-muted-foreground text-xs font-semibold">
              {counts?.buy !== undefined ? counts.buy : 18}
            </span>
          </label>

          <label className="hover:bg-muted/40 flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selectedTypes.includes('rent')}
                onChange={() => handleTypeToggle('rent')}
                className="h-4 w-4 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Rent</span>
            </div>
            <span className="text-muted-foreground text-xs font-semibold">
              {counts?.rent !== undefined ? counts.rent : 8}
            </span>
          </label>

          <label className="hover:bg-muted/40 flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selectedTypes.includes('custom')}
                onChange={() => handleTypeToggle('custom')}
                className="h-4 w-4 rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Custom Order</span>
            </div>
            <span className="text-muted-foreground text-xs font-semibold">
              {counts?.custom !== undefined ? counts.custom : 11}
            </span>
          </label>
        </div>
      </div>

      {/* Shop by Occasion Section (Collapsible Tree Style) */}
      <div className="space-y-1 border-t pt-4">
        <h3 className="text-muted-foreground mb-2 text-xs font-bold uppercase tracking-wider">
          Occasion
        </h3>
        <div className="space-y-1">
          <div
            onClick={() => setIsOccasionExpanded(!isOccasionExpanded)}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm',
              selectedOccasions.length > 0 || isOccasionExpanded
                ? 'shadow-2xs border border-emerald-300 bg-emerald-50 font-bold text-emerald-700'
                : 'hover:bg-muted text-foreground/80',
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">Shop by Occasion</span>
              {selectedOccasions.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  {selectedOccasions.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOccasionExpanded(!isOccasionExpanded);
              }}
              className="text-muted-foreground/70 p-1 transition-transform hover:text-emerald-700"
              aria-label="Toggle Shop by Occasion"
            >
              <svg
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isOccasionExpanded ? 'rotate-90' : '',
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Subcategories Child Tree for Occasions */}
          {isOccasionExpanded && (
            <div className="my-1 ml-3 space-y-1 border-l-2 border-emerald-200 pl-3">
              {OCCASION_OPTIONS.map((occ) => {
                const isSelected = selectedOccasions.includes(occ.id);
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => handleOccasionToggle(occ.id)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                      isSelected
                        ? 'shadow-2xs bg-emerald-600 font-bold text-white'
                        : 'hover:bg-muted/70 text-foreground/70',
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="select-none text-xs">{occ.icon}</span>
                      <span className="truncate">{occ.label}</span>
                    </div>
                    <span
                      className={cn(
                        'ml-1 shrink-0 text-[10px]',
                        isSelected ? 'text-white/80' : 'text-muted-foreground',
                      )}
                    >
                      {occ.labelAm}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Section with Expandable Tree */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
          Category
        </h3>
        <div className="space-y-1">
          {categoryOptions.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            const hasChildren = Boolean(cat.children && cat.children.length > 0);
            const isChildSelected = Boolean(
              cat.children?.some((child) => child.value === selectedCategory),
            );
            const isExpanded = expandedCats[cat.value] ?? (isSelected || isChildSelected);
            const parentCount = categoryCounts?.[cat.value];

            return (
              <div key={cat.value} className="space-y-1">
                <div
                  onClick={() => handleCategorySelect(cat.value)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm',
                    isSelected
                      ? 'shadow-2xs border border-emerald-300 bg-emerald-50 font-bold text-emerald-700'
                      : isChildSelected
                        ? 'bg-emerald-50/40 font-semibold text-emerald-700'
                        : 'hover:bg-muted text-foreground/80',
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{cat.label}</span>
                    {parentCount !== undefined && parentCount > 0 && (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600">
                        {parentCount}
                      </span>
                    )}
                  </div>

                  {hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(cat.value, e)}
                      className="text-muted-foreground/70 p-1 transition-transform hover:text-emerald-700"
                      aria-label={`Toggle subcategories for ${cat.label}`}
                    >
                      <svg
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          isExpanded ? 'rotate-90' : '',
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Subcategories Child Tree */}
                {hasChildren && isExpanded && (
                  <div className="my-1 ml-3 space-y-1 border-l-2 border-emerald-200 pl-3">
                    {cat.children!.map((child) => {
                      const isSubSelected = selectedCategory === child.value;
                      const subCount = categoryCounts?.[child.value];

                      return (
                        <button
                          key={child.value}
                          type="button"
                          onClick={() => handleCategorySelect(child.value)}
                          className={cn(
                            'flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                            isSubSelected
                              ? 'shadow-2xs bg-emerald-600 font-bold text-white'
                              : 'hover:bg-muted/70 text-foreground/70',
                          )}
                        >
                          <span className="truncate">{child.label}</span>
                          {subCount !== undefined && subCount > 0 && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 text-[10px] font-bold',
                                isSubSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-emerald-50 text-emerald-700',
                              )}
                            >
                              {subCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fabric & Craft Section (Collapsible Tree Style) */}
      <div className="space-y-1 border-t pt-4">
        <h3 className="text-muted-foreground mb-2 text-xs font-bold uppercase tracking-wider">
          Fabric & Craft
        </h3>
        <div className="space-y-1">
          <div
            onClick={() => setIsFabricExpanded(!isFabricExpanded)}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm',
              selectedFabrics.length > 0 || isFabricExpanded
                ? 'shadow-2xs border border-emerald-300 bg-emerald-50 font-bold text-emerald-700'
                : 'hover:bg-muted text-foreground/80',
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">Fabric & Material</span>
              {selectedFabrics.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  {selectedFabrics.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFabricExpanded(!isFabricExpanded);
              }}
              className="text-muted-foreground/70 p-1 transition-transform hover:text-emerald-700"
              aria-label="Toggle Fabric & Material"
            >
              <svg
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isFabricExpanded ? 'rotate-90' : '',
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Subcategories Child Tree for Fabrics */}
          {isFabricExpanded && (
            <div className="my-1 ml-3 space-y-1 border-l-2 border-emerald-200 pl-3">
              {FABRIC_OPTIONS.map((fab) => {
                const isSelected = selectedFabrics.includes(fab.id);
                return (
                  <button
                    key={fab.id}
                    type="button"
                    onClick={() => handleFabricToggle(fab.id)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                      isSelected
                        ? 'shadow-2xs bg-emerald-600 font-bold text-white'
                        : 'hover:bg-muted/70 text-foreground/70',
                    )}
                  >
                    <span className="truncate">{fab.label}</span>
                    <span
                      className={cn(
                        'ml-1 shrink-0 text-[10px]',
                        isSelected ? 'text-white/80' : 'text-muted-foreground',
                      )}
                    >
                      {fab.labelAm}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Seller Verification Badge Filter */}
      <div className="border-t pt-4">
        <label className="border-border/60 hover:bg-muted/40 bg-background flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => handleVerifiedToggle(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
          />
          <div className="text-xs">
            <div className="text-foreground flex items-center gap-1.5 font-semibold">
              <svg className="h-3.5 w-3.5 fill-current text-emerald-600" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Verified Sellers Only</span>
            </div>
            <div className="text-muted-foreground text-[10px]">
              Certified artisans & verified boutiques
            </div>
          </div>
        </label>
      </div>

      {/* Price Range (ETB) Section */}
      <div className="space-y-3 border-t pt-4">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
          Price Range (ETB)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => handlePriceChange(minPrice, maxPrice)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePriceChange(minPrice, maxPrice);
            }}
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => handlePriceChange(minPrice, maxPrice)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePriceChange(minPrice, maxPrice);
            }}
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Quick Range Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_PRICE_RANGES.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePricePreset(p.min, p.max)}
              className="bg-muted/30 text-foreground cursor-pointer rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
          Location
        </h3>
        <select
          value={city}
          disabled={allEthiopia}
          onChange={(e) => {
            setCity(e.target.value);
            apply({ city: e.target.value });
          }}
          className="border-input bg-background h-9 w-full rounded-lg border px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="text-foreground flex cursor-pointer items-center gap-2 pt-1 text-xs">
          <input
            type="checkbox"
            checked={allEthiopia}
            onChange={(e) => {
              setAllEthiopia(e.target.checked);
              apply({ city: e.target.checked ? undefined : city });
            }}
            className="h-3.5 w-3.5 cursor-pointer rounded border-emerald-600 text-emerald-600 focus:ring-emerald-500"
          />
          <span>All Ethiopia</span>
        </label>
      </div>

      {/* Size Section */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Size</h3>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_OPTIONS.map((sz) => {
            const isSelected = selectedSizes.includes(sz);
            return (
              <button
                key={sz}
                type="button"
                onClick={() => handleSizeToggle(sz)}
                className={cn(
                  'h-8 w-9 cursor-pointer rounded-lg border text-xs font-bold transition-colors',
                  isSelected
                    ? 'shadow-2xs border-emerald-600 bg-emerald-600 text-white'
                    : 'bg-background hover:bg-muted text-foreground',
                )}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition Section (Rental Products Only) */}
      {isRentalActive && (
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                Condition
              </h3>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                Rentals Only
              </span>
            </div>
            {selectedCondition && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCondition('');
                  apply({ condition: '' });
                }}
                className="text-muted-foreground cursor-pointer text-[11px] font-medium hover:text-emerald-600"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-muted-foreground text-[11px]">Rental dress condition & wear rating</p>
          <div className="space-y-1 pt-1">
            {conditionOptions.map((c) => (
              <label
                key={c.value}
                className="text-foreground hover:bg-muted/40 flex cursor-pointer items-center justify-between rounded px-2 py-1 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="condition"
                    checked={selectedCondition === c.value}
                    onChange={() => handleConditionSelect(c.value)}
                    className="h-3.5 w-3.5 cursor-pointer text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{c.label}</span>
                </div>
                {selectedCondition === c.value && (
                  <span className="text-[10px] font-semibold text-emerald-600">Active</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

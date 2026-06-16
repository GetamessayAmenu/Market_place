"use client"
import { cn } from '@marketplace/ui';
import React, { useCallback, useRef, useState } from 'react';

type SearchBarVariant = 'compact' | 'hero' | 'filter';

export interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  variant?: SearchBarVariant;
  /** Show spinner when searching */
  isSearching?: boolean;
  className?: string;
}

const variantClasses: Record<SearchBarVariant, string> = {
  compact: 'h-10 text-sm rounded-lg',
  hero: 'h-14 text-base rounded-xl shadow-md',
  filter: 'h-9 text-sm rounded-md',
};

const iconSizeClasses: Record<SearchBarVariant, string> = {
  compact: 'h-4 w-4 left-3',
  hero: 'h-5 w-5 left-4',
  filter: 'h-4 w-4 left-2.5',
};

const paddingClasses: Record<SearchBarVariant, string> = {
  compact: 'pl-10 pr-9',
  hero: 'pl-12 pr-10',
  filter: 'pl-8 pr-8',
};

export default function SearchBar({
  defaultValue = '',
  placeholder = 'Search habesha dresses, rentals, custom tailors...',
  onSearch,
  variant = 'compact',
  isSearching = false,
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearch(newValue);
      }, 300);
    },
    [onSearch]
  );

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearch(value);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)} role="search">
      <div className="relative">
        {/* Search icon */}
        {isSearching ? (
          <svg
            className={cn('absolute top-1/2 -translate-y-1/2 animate-spin text-muted-foreground', iconSizeClasses[variant])}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg
            className={cn('absolute top-1/2 -translate-y-1/2 text-muted-foreground', iconSizeClasses[variant])}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}

        <input
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Search listings"
          className={cn(
            'w-full border border-input bg-background placeholder:text-muted-foreground',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus-visible:border-brand-gold',
            variantClasses[variant],
            paddingClasses[variant]
          )}
        />

        {/* Clear button */}
        {value.length > 0 && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 rounded-full p-1',
              'text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors',
              variant === 'hero' ? 'right-3' : 'right-2'
            )}
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}

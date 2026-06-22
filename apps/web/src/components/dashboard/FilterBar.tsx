import { cn } from '@marketplace/ui';
import React from 'react';

// ─── FilterChip ──────────────────────────────────────────────────────────────

export interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
        aria-label={`Remove filter: ${label}`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ─── FilterBar ───────────────────────────────────────────────────────────────

export interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {children}
    </div>
  );
}

// ─── ActiveFilters ───────────────────────────────────────────────────────────

export interface ActiveFiltersProps {
  chips: { key: string; label: string; onRemove: () => void }[];
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({ chips, onClearAll, className }: ActiveFiltersProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} aria-live="polite">
      {chips.map((chip) => (
        <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
      ))}
      {chips.length > 1 && (
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

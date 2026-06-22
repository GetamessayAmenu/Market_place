import { cn } from '@marketplace/ui';
import React from 'react';

export interface StatusBreakdownItem {
  label: string;
  count: number;
  dotColor: string;
  barColor: string;
}

export interface StatusBreakdownProps {
  items: StatusBreakdownItem[];
  className?: string;
}

export default function StatusBreakdown({ items, className }: StatusBreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', item.dotColor)} />
          <span className="flex-1 text-sm text-foreground">{item.label}</span>
          <span className="text-sm font-semibold tabular-nums">{item.count}</span>
        </div>
      ))}
      {/* Stacked bar */}
      {total > 0 && (
        <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Status distribution">
          {items.map((item) => {
            const width = (item.count / total) * 100;
            if (width === 0) return null;
            return (
              <div
                key={item.label}
                className={cn('transition-all duration-300', item.barColor)}
                style={{ width: `${String(width)}%` }}
                title={`${item.label}: ${String(item.count)}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from '@marketplace/ui';
import React from 'react';

import type { RentalItem } from '../../../lib/dashboardApi';
import { formatShortDate } from '../../../lib/formatters';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface RentalOverviewModuleProps {
  rentals: RentalItem[] | undefined;
  isLoading: boolean;
  lang: Lang;
  onMarkCondition: (id: string, condition: 'good' | 'damaged' | 'needs_cleaning') => void;
}

function UtilizationBadge({ rate }: { rate: number }) {
  const isHigh = rate >= 70;
  const isMed = rate >= 40 && rate < 70;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        isHigh ? 'bg-brand-green/10 text-brand-green' : isMed ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
      )}
      title="Utilization Rate (booked days / available days)"
    >
      {Math.round(rate)}% Util
    </div>
  );
}

export default function RentalOverviewModule({
  rentals,
  isLoading,
  lang,
  onMarkCondition,
}: RentalOverviewModuleProps) {
  const activeRentals = (rentals ?? []).filter((r) => r.status !== 'returned');

  if (!isLoading && activeRentals.length === 0) {
    return null; // Only show if they have active rentals (or during loading so layout doesn't jump)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{t('rental_title', lang)}</CardTitle>
        <a href="/dashboard/seller/rentals" className="text-xs font-medium text-primary hover:underline">
          Manage rentals →
        </a>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Active rentals">
            {activeRentals.map((rental) => {
              const utilRate = (rental.totalDaysBooked / rental.totalDaysAvailable) * 100;
              const daysUntilReturn = Math.ceil((new Date(rental.returnDate).getTime() - Date.now()) / 86400000);
              const isOverdue = daysUntilReturn < 0;
              const isWarning = daysUntilReturn >= 0 && daysUntilReturn <= 3;

              return (
                <div
                  key={rental.id}
                  className={cn(
                    'group relative rounded-xl border p-4 transition-all hover:shadow-sm',
                    isOverdue ? 'border-l-4 border-l-destructive bg-destructive/5' : isWarning ? 'border-l-4 border-l-warning bg-warning/5' : ''
                  )}
                  role="listitem"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base" aria-hidden="true">🔄</span>
                        <p className="truncate text-sm font-semibold">{rental.title}</p>
                        <UtilizationBadge rate={utilRate} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{rental.customerName}</span>
                        <span>·</span>
                        <span className={cn(
                          'font-semibold',
                          isOverdue ? 'text-destructive' : isWarning ? 'text-warning' : 'text-muted-foreground'
                        )}>
                          Return: {formatShortDate(rental.returnDate)}
                          {isOverdue && ' (Overdue)'}
                          {isWarning && ` (in ${daysUntilReturn}d)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for returned/overdue items */}
                  {rental.needsInspection && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-destructive/10 pt-3">
                      <span className="text-xs font-medium text-destructive">Needs inspection</span>
                      <button
                        onClick={() => onMarkCondition(rental.id, 'good')}
                        className="rounded bg-brand-green/10 px-2.5 py-1 text-xs font-medium text-brand-green hover:bg-brand-green hover:text-white transition-colors"
                      >
                        {t('rental_good', lang)}
                      </button>
                      <button
                        onClick={() => onMarkCondition(rental.id, 'needs_cleaning')}
                        className="rounded bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning hover:bg-warning hover:text-white transition-colors"
                      >
                        Clean
                      </button>
                      <button
                        onClick={() => onMarkCondition(rental.id, 'damaged')}
                        className="rounded bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive hover:text-white transition-colors"
                      >
                        {t('rental_damaged', lang)}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

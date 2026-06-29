'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from '@marketplace/ui';
import React from 'react';

import type { InventoryAlert } from '../../../lib/dashboardApi';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface InventoryAlertsModuleProps {
  alerts: InventoryAlert[] | undefined;
  isLoading: boolean;
  lang: Lang;
}

const ALERT_CONFIG = {
  low_stock: {
    icon: '📉',
    bg: 'bg-warning/5',
    border: 'border-warning/30',
    titleColor: 'text-warning-foreground',
    label: 'inventory_low_stock',
  },
  out_of_stock: {
    icon: '❌',
    bg: 'bg-destructive/5',
    border: 'border-destructive/30',
    titleColor: 'text-destructive',
    label: 'inventory_out_of_stock',
  },
  expiring: {
    icon: '⏳',
    bg: 'bg-info/5',
    border: 'border-info/30',
    titleColor: 'text-info',
    label: 'inventory_expiring',
  },
  few_photos: {
    icon: '📸',
    bg: 'bg-accent',
    border: 'border-border',
    titleColor: 'text-foreground',
    label: 'inventory_few_photos',
  },
  incomplete: {
    icon: '⚠️',
    bg: 'bg-warning/5',
    border: 'border-warning/30',
    titleColor: 'text-warning-foreground',
    label: 'inventory_incomplete',
  },
};

export default function InventoryAlertsModule({
  alerts,
  isLoading,
  lang,
}: InventoryAlertsModuleProps) {
  if (!isLoading && (!alerts || alerts.length === 0)) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{t('inventory_title', lang)}</CardTitle>
        {!isLoading && alerts && alerts.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-[10px] font-bold text-warning-foreground">
            {alerts.length}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5" role="list">
            {(alerts ?? []).map((alert) => {
              const config = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.incomplete;
              return (
                <a
                  key={alert.id}
                  href={`/dashboard/seller/listings/${alert.listingId}`}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl border p-3 transition-all hover:shadow-sm hover:scale-[1.01]',
                    config.bg,
                    config.border
                  )}
                  role="listitem"
                >
                  <div className="mt-0.5 text-lg" aria-hidden="true">{config.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('text-xs font-bold uppercase tracking-wide', config.titleColor)}>
                        {t(config.label as any, lang)}
                      </span>
                      <span className="truncate text-sm font-semibold text-foreground">{alert.listingTitle}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                  <svg className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:text-primary group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, Skeleton, cn } from '@marketplace/ui';
import React from 'react';

import type { DashboardKpis } from '../../../lib/dashboardApi';
import { formatETB, formatPctChange } from '../../../lib/formatters';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface KpiGridProps {
  kpis: DashboardKpis | undefined;
  isLoading: boolean;
  lang: Lang;
}

const TrendArrow = ({ direction, value }: { direction: 'up' | 'down' | 'neutral'; value: string }) => {
  const colorMap = {
    up: 'text-brand-green',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };
  return (
    <div className={cn('flex items-center gap-0.5 text-xs font-medium', colorMap[direction])}>
      {direction === 'up' && (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )}
      {direction === 'down' && (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {direction === 'neutral' && <span>—</span>}
      <span>{value}</span>
    </div>
  );
};

interface SingleKpiCardProps {
  label: string;
  value: string | number;
  trend?: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
  badge?: number;
  subtitle?: string;
}

function SingleKpiCard({ label, value, trend, icon, iconBg, badge, subtitle }: SingleKpiCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="relative ml-3 shrink-0">
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
              {icon}
            </div>
            {badge !== undefined && badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
        </div>
        {(trend || subtitle) && (
          <div className="mt-2.5 space-y-0.5">
            {trend}
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KpiGrid({ kpis, isLoading, lang }: KpiGridProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 fashion-lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-20 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const revenueChange = kpis.todaysRevenueChange;
  const revDirection =
    revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'neutral';

  return (
    <div className="grid gap-4 sm:grid-cols-2 fashion-lg:grid-cols-5" role="region" aria-label="Key performance indicators">
      {/* Today's Revenue */}
      <SingleKpiCard
        label={t('kpi_todays_revenue', lang)}
        value={formatETB(kpis.todaysRevenue)}
        trend={
          <TrendArrow
            direction={revDirection}
            value={`${formatPctChange(revenueChange)} ${t('kpi_vs_yesterday', lang)}`}
          />
        }
        iconBg="bg-brand-green/10 text-brand-green"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Pending Actions */}
      <SingleKpiCard
        label={t('kpi_pending_actions', lang)}
        value={kpis.pendingActionsCount}
        badge={kpis.pendingActionsCount}
        trend={
          kpis.pendingActionsCount > 0 ? (
            <p className="text-xs font-medium text-destructive">
              Requires your attention
            </p>
          ) : (
            <p className="text-xs text-brand-green font-medium">{t('kpi_all_clear', lang)}</p>
          )
        }
        iconBg="bg-destructive/10 text-destructive"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        }
      />

      {/* Active Products */}
      <SingleKpiCard
        label={t('kpi_active_products', lang)}
        value={kpis.activeProductsCount}
        trend={
          <TrendArrow direction="neutral" value="across all types" />
        }
        iconBg="bg-brand-gold/10 text-brand-gold"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          </svg>
        }
      />

      {/* Total Messages */}
      <SingleKpiCard
        label={t('kpi_total_messages', lang)}
        value={kpis.unreadMessagesCount}
        badge={kpis.unreadMessagesCount}
        subtitle={kpis.latestMessagePreview}
        trend={
          kpis.unreadMessagesCount > 0 ? (
            <p className="text-xs font-medium text-info">
              {kpis.unreadMessagesCount} {t('kpi_unread', lang)}
            </p>
          ) : undefined
        }
        iconBg="bg-info/10 text-info"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        }
      />

      {/* This Week's Performance */}
      <SingleKpiCard
        label={t('kpi_weekly_performance', lang)}
        value={formatETB(kpis.weekRevenue)}
        trend={
          <TrendArrow
            direction="up"
            value={`${kpis.weekOrdersFulfilled} orders · ${kpis.weekConversionRate.toFixed(1)}% CVR`}
          />
        }
        iconBg="bg-brand-wine/10 text-brand-wine"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        }
      />
    </div>
  );
}

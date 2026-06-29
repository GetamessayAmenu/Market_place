'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from '@marketplace/ui';
import React from 'react';

import type { CustomOrderPipeline } from '../../../lib/dashboardApi';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface CustomOrderModuleProps {
  pipeline: CustomOrderPipeline | undefined;
  isLoading: boolean;
  lang: Lang;
}

export default function CustomOrderModule({
  pipeline,
  isLoading,
  lang,
}: CustomOrderModuleProps) {
  if (!isLoading && !pipeline) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{t('custom_title', lang)}</CardTitle>
        <a href="/dashboard/seller/orders?type=custom" className="text-xs font-medium text-primary hover:underline">
          View custom orders →
        </a>
      </CardHeader>
      <CardContent>
        {isLoading || !pipeline ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pipeline stages */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <a href="/dashboard/seller/orders?type=custom&status=new" className="group flex flex-col items-center justify-center rounded-lg border bg-accent/20 p-2 transition-colors hover:bg-accent hover:border-primary/30">
                <span className="text-lg font-bold text-foreground group-hover:text-primary">{pipeline.newRequests}</span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t('custom_new', lang)}</span>
              </a>
              <a href="/dashboard/seller/orders?type=custom&status=production" className="group flex flex-col items-center justify-center rounded-lg border bg-accent/20 p-2 transition-colors hover:bg-accent hover:border-primary/30">
                <span className="text-lg font-bold text-foreground group-hover:text-primary">{pipeline.inProduction}</span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t('custom_in_production', lang)}</span>
              </a>
              <a href="/dashboard/seller/orders?type=custom&status=ready" className="group flex flex-col items-center justify-center rounded-lg border bg-accent/20 p-2 transition-colors hover:bg-accent hover:border-primary/30">
                <span className="text-lg font-bold text-foreground group-hover:text-primary">{pipeline.ready}</span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t('custom_ready', lang)}</span>
              </a>
              <a href="/dashboard/seller/orders?type=custom&status=delivered" className="group flex flex-col items-center justify-center rounded-lg border bg-accent/20 p-2 transition-colors hover:bg-accent hover:border-primary/30">
                <span className="text-lg font-bold text-foreground group-hover:text-primary">{pipeline.delivered}</span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t('custom_delivered', lang)}</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Bottlenecks / Waiting */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Action Required</p>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Awaiting design approval</span>
                  <span className={cn('font-bold', pipeline.awaitingDesignApproval > 0 ? 'text-warning' : 'text-foreground')}>{pipeline.awaitingDesignApproval}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Awaiting materials</span>
                  <span className={cn('font-bold', pipeline.awaitingMaterials > 0 ? 'text-warning' : 'text-foreground')}>{pipeline.awaitingMaterials}</span>
                </div>
              </div>

              {/* Stats & Urgent */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Performance & Deadlines</p>
                <div className="flex items-center justify-between rounded-lg border bg-brand-green/5 px-3 py-2 text-sm border-brand-green/20">
                  <span className="text-muted-foreground">Avg Production Time</span>
                  <div className="text-right">
                    <span className="font-bold text-brand-green">{pipeline.avgProductionDays} days</span>
                    <span className="ml-1 text-[10px] font-medium text-brand-green">({pipeline.avgProductionDaysChange > 0 ? '+' : ''}{pipeline.avgProductionDaysChange}d)</span>
                  </div>
                </div>
                {pipeline.urgentDeadlines.length > 0 && (
                  <div className="rounded-lg border-l-4 border-l-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    <p className="font-bold">{t('custom_urgent', lang)}</p>
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {pipeline.urgentDeadlines.map((u) => (
                        <li key={u.id} className="truncate">
                          {u.title} ({u.daysUntilDeadline}d left)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

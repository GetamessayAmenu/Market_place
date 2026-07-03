'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, Tabs } from '@marketplace/ui';
import React, { useState } from 'react';

import type { RevenueChartPoint } from '../../../lib/dashboardApi';
import { formatETB } from '../../../lib/formatters';
import type { Lang } from '../../../lib/i18n';

// Lazy load the chart for performance
const MiniBarChart = React.lazy(() => import('../../dashboard/MiniBarChart'));

interface SalesOverviewModuleProps {
  chartData: RevenueChartPoint[] | undefined;
  isLoading: boolean;

  range: '7d' | '30d' | '90d' | '1y';
  onRangeChange: (r: '7d' | '30d' | '90d' | '1y') => void;
}

export default function SalesOverviewModule({
  chartData,
  isLoading,

  range,
  onRangeChange,
}: SalesOverviewModuleProps) {
  const [productFilter, setProductFilter] = useState<'all' | 'sale' | 'rent' | 'custom'>('all');

  const filteredData = (chartData ?? []).filter(
    (point) => productFilter === 'all' || point.category === productFilter
  );
  const totalRevenue = filteredData.reduce((acc, p) => acc + p.value, 0);
  const totalPoints = filteredData.length;
  const avgOrderValue = totalPoints > 0 ? Math.round(totalRevenue / totalPoints) : 0;
  const categoryCounts = (chartData ?? []).reduce(
    (acc, point) => {
      acc[point.category] += 1;
      return acc;
    },
    { sale: 0, rent: 0, custom: 0 } as Record<'sale' | 'rent' | 'custom', number>
  );
  const breakdownLabel =
    productFilter === 'all'
      ? `${categoryCounts.sale} sales · ${categoryCounts.rent} rentals · ${categoryCounts.custom} custom`
      : `${productFilter === 'sale' ? 'Sales' : productFilter === 'rent' ? 'Rentals' : 'Custom'} only`;
  const pendingPayments = Math.round(totalRevenue * 0.22);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 fashion-sm:flex-row fashion-sm:items-center fashion-sm:justify-between">
          <CardTitle className="text-base">Sales Overview</CardTitle>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 fashion-sm:pb-0">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value as any)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="all">All Products</option>
              <option value="sale">Sales</option>
              <option value="rent">Rentals</option>
              <option value="custom">Custom Orders</option>
            </select>
            <Tabs
              variant="pills"
              tabs={[
                { value: '7d', label: '7d' },
                { value: '30d', label: '30d' },
                { value: '90d', label: '90d' },
                { value: '1y', label: '1y' },
              ]}
              value={range}
              onChange={(v) => onRangeChange(v as any)}
              className="w-auto shrink-0"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-baseline gap-2">
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <span className="text-3xl font-bold tracking-tight">{formatETB(totalRevenue)}</span>
              <span className="text-sm font-medium text-muted-foreground">total revenue</span>
            </>
          )}
        </div>

        {/* Chart */}
        <div className="h-32 w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <React.Suspense fallback={<Skeleton className="h-full w-full" />}>
              <MiniBarChart
                data={filteredData.length > 0 ? filteredData : chartData ?? []}
                height={128}
                color="bg-primary/80 hover:bg-primary"
              />
            </React.Suspense>
          )}
        </div>

        {/* Summary stats */}
        {!isLoading && (
          <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Top Category</p>
              <p className="mt-1 font-semibold text-foreground">{productFilter === 'all' ? 'Habesha Kemis' : productFilter === 'sale' ? 'Kemis' : productFilter === 'rent' ? 'Rental Dresses' : 'Custom Orders'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Avg Order Value</p>
              <p className="mt-1 font-semibold text-foreground">{formatETB(avgOrderValue)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Conversion Rate</p>
              <p className="mt-1 font-semibold text-brand-green">{productFilter === 'sale' ? '5.1%' : productFilter === 'rent' ? '3.6%' : productFilter === 'custom' ? '2.9%' : '4.2%'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Pending Payments</p>
              <p className="mt-1 font-semibold text-warning">{formatETB(pendingPayments)}</p>
            </div>
          </div>
        )}
        {!isLoading && (
          <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
            {breakdownLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

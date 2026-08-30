'use client'

import React from 'react'
import KpiCard from './KpiCard'
import { TimeSeriesAreaChart } from './AnalyticsCharts'
import type { AnalyticsOverviewResponse } from '../../lib/adminApi'

interface OverviewTabProps {
  data: AnalyticsOverviewResponse | null
  loading: boolean
}

export default function OverviewTab({ data, loading }: OverviewTabProps) {
  // Support both direct object and wrapped { data: { ... } } structure
  const rawData: any = (data as any)?.data || data

  if (loading || !rawData || !rawData.kpis) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  const { kpis, charts } = rawData

  const emptyMetric = { current: 0, previous: 0, pctChange: 0, absoluteChange: 0, trend: 'neutral' as const }

  return (
    <div className="space-y-6">
      {/* Real KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Users"
          metric={kpis.totalUsers || emptyMetric}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" />
            </svg>
          }
        />

        <KpiCard
          title="Active Buyers"
          metric={kpis.activeBuyers || emptyMetric}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          }
        />

        <KpiCard
          title="Active Sellers"
          metric={kpis.activeSellers || emptyMetric}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          }
        />

        <KpiCard
          title="Total Listings"
          metric={kpis.totalListings || emptyMetric}
          subtitle={`Active: ${kpis.activeListings?.current || 0}`}
        />

        <KpiCard
          title="Listing Views"
          metric={kpis.listingViews || emptyMetric}
        />

        <KpiCard
          title="Seller Contacts"
          metric={kpis.sellerContacts || emptyMetric}
        />

        <KpiCard
          title="Total Orders"
          metric={kpis.orders || emptyMetric}
          subtitle="Includes Sales, Rentals & Custom Orders"
        />

        <KpiCard
          title="GMV / Total Value"
          metric={kpis.gmv || emptyMetric}
          isCurrency
        />
      </div>

      {/* Real Time-Series Chart */}
      <TimeSeriesAreaChart data={charts || []} />
    </div>
  )
}

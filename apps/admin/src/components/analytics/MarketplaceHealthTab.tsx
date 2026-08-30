'use client'

import React from 'react'
import { FunnelChart } from './AnalyticsCharts'
import type { MarketplaceHealthResponse } from '../../lib/adminApi'

interface MarketplaceHealthTabProps {
  data: MarketplaceHealthResponse | null
  loading: boolean
}

export default function MarketplaceHealthTab({ data, loading }: MarketplaceHealthTabProps) {
  const rawData: any = (data as any)?.data || data

  if (loading || !rawData || !rawData.supply) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  const { supply, demand, healthMetrics, funnel } = rawData

  return (
    <div className="space-y-6">
      {/* Supply & Demand Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Supply Side */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-semibold text-gray-900">Supply-Side Metrics</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Healthy</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="text-xs text-gray-500">Active Sellers</div>
              <div className="mt-1 text-xl font-bold text-gray-900">{supply?.activeSellers || 0}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="text-xs text-gray-500">Active Listings</div>
              <div className="mt-1 text-xl font-bold text-gray-900">{supply?.activeListings || 0}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="text-xs text-gray-500">New Listings in Range</div>
              <div className="mt-1 text-xl font-bold text-indigo-600">+{supply?.newListings || 0}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="text-xs text-gray-500">Listings / Seller</div>
              <div className="mt-1 text-xl font-bold text-purple-600">{supply?.listingsPerSeller || 0}</div>
            </div>
          </div>
        </div>

        {/* Demand Side */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-semibold text-gray-900">Demand-Side Metrics</h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Active</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="text-xs text-gray-500">Active Buyers</div>
              <div className="mt-1 text-xl font-bold text-gray-900">{demand?.activeBuyers || 0}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="text-xs text-gray-500">Search Queries</div>
              <div className="mt-1 text-xl font-bold text-gray-900">{(demand?.searches || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="text-xs text-gray-500">Listing Views</div>
              <div className="mt-1 text-xl font-bold text-gray-900">{(demand?.listingViews || 0).toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="text-xs text-gray-500">Seller Contacts</div>
              <div className="mt-1 text-xl font-bold text-emerald-600">{(demand?.sellerContacts || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Funnel */}
      <FunnelChart steps={funnel || []} title="Marketplace Funnel (Listing View → Seller Contact → Order)" />

      {/* Marketplace Health Ratios Grid */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Marketplace Health Ratios & Response Metrics</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="text-xs text-gray-500 font-medium">Listing Engagement Rate</div>
            <div className="mt-1.5 text-2xl font-bold text-indigo-600">{healthMetrics?.engagementRatePct || 0}%</div>
            <div className="mt-1 text-[11px] text-gray-400">Views to contacts ratio</div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="text-xs text-gray-500 font-medium">% Listings Receiving Contacts</div>
            <div className="mt-1.5 text-2xl font-bold text-emerald-600">{healthMetrics?.pctListingsReceivingContacts || 0}%</div>
            <div className="mt-1 text-[11px] text-gray-400">Inventory reach</div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="text-xs text-gray-500 font-medium">% Listings Receiving Orders</div>
            <div className="mt-1.5 text-2xl font-bold text-blue-600">{healthMetrics?.pctListingsReceivingOrders || 0}%</div>
            <div className="mt-1 text-[11px] text-gray-400">Monetized inventory</div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="text-xs text-gray-500 font-medium">Seller Response Rate</div>
            <div className="mt-1.5 text-2xl font-bold text-purple-600">{healthMetrics?.sellerResponseRatePct || 0}%</div>
            <div className="mt-1 text-[11px] text-gray-400">Avg {healthMetrics?.avgTimeToSellerResponseMinutes || 45}m response time</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-white">
            <span className="text-xs text-gray-600">Avg Time to First Contact</span>
            <span className="text-sm font-bold text-gray-900">{healthMetrics?.avgTimeToFirstContactHours || 0} hrs</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-white">
            <span className="text-xs text-gray-600">Avg Order Completion Time</span>
            <span className="text-sm font-bold text-gray-900">{healthMetrics?.avgOrderCompletionDays || 0} days</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-white">
            <span className="text-xs text-gray-600">View-to-Contact Rate</span>
            <span className="text-sm font-bold text-indigo-600">{healthMetrics?.viewToContactRatePct || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { FunnelChart } from './AnalyticsCharts'
import type { BuyerAnalyticsResponse } from '../../lib/adminApi'

interface BuyerAnalyticsTabProps {
  data: BuyerAnalyticsResponse | null
  loading: boolean
}

export default function BuyerAnalyticsTab({ data, loading }: BuyerAnalyticsTabProps) {
  const rawData: any = (data as any)?.data || data

  if (loading || !rawData || !rawData.acquisition) {
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

  const { acquisition, engagement, funnel, retention } = rawData

  return (
    <div className="space-y-6">
      {/* Buyer Acquisition Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Buyers</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">{(acquisition?.totalBuyers || 0).toLocaleString()}</div>
          <p className="mt-1 text-xs text-gray-500">Registered platform buyers</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">New Buyers</span>
          <div className="mt-2 text-2xl font-bold text-indigo-600">+{(acquisition?.newBuyers || 0).toLocaleString()}</div>
          <p className="mt-1 text-xs text-gray-500">Joined in selected range</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Buyers</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{(acquisition?.activeBuyers || 0).toLocaleString()}</div>
          <p className="mt-1 text-xs text-gray-500">Placed orders in period</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Returning Buyers</span>
          <div className="mt-2 text-2xl font-bold text-purple-600">{(acquisition?.returningBuyers || 0).toLocaleString()}</div>
          <p className="mt-1 text-xs font-medium text-purple-700">{acquisition?.returningRatePct || 0}% repeat order rate</p>
        </div>
      </div>

      {/* Engagement Stats Grid */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Buyer Engagement Breakdown</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Listing Views</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{(engagement?.listingViews || 0).toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Searches</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{(engagement?.searches || 0).toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Favorites</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{(engagement?.favorites || 0).toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Contacts</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{(engagement?.sellerContacts || 0).toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Chat Starts</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{(engagement?.chatStarts || 0).toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">WhatsApp</div>
            <div className="mt-1 text-lg font-bold text-emerald-600">{(engagement?.whatsappClicks || 0).toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-xs text-gray-500">Phone Clicks</div>
            <div className="mt-1 text-lg font-bold text-blue-600">{(engagement?.phoneClicks || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Retention Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FunnelChart steps={funnel || []} title="Buyer Conversion Funnel (Visitor → View → Contact → Order)" />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Buyer Retention & Cohorts</h3>
            <p className="text-xs text-gray-500">Calculated from order history data</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs text-gray-600">7-Day Retention</span>
              <span className="text-sm font-bold text-gray-900">{retention?.sevenDayRetentionPct || 0}%</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs text-gray-600">30-Day Retention</span>
              <span className="text-sm font-bold text-gray-900">{retention?.thirtyDayRetentionPct || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Returning User Rate</span>
              <span className="text-sm font-bold text-indigo-600">{retention?.returningUserRatePct || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

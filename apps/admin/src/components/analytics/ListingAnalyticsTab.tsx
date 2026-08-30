'use client'

import React from 'react'
import type { ListingAnalyticsResponse } from '../../lib/adminApi'

interface ListingAnalyticsTabProps {
  data: ListingAnalyticsResponse | null
  loading: boolean
}

export default function ListingAnalyticsTab({ data, loading }: ListingAnalyticsTabProps) {
  const rawData: any = (data as any)?.data || data

  if (loading || !rawData || !rawData.metrics) {
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

  const { metrics, topListings, lowPerformingListings, categoryBreakdown } = rawData

  return (
    <div className="space-y-6">
      {/* Listing Status Breakdown */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <div className="text-xs text-gray-500">Total</div>
          <div className="mt-1 text-xl font-bold text-gray-900">{metrics?.totalListings || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <div className="text-xs text-emerald-600 font-medium">Active</div>
          <div className="mt-1 text-xl font-bold text-emerald-600">{metrics?.activeListings || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <div className="text-xs text-amber-600 font-medium">Pending</div>
          <div className="mt-1 text-xl font-bold text-amber-600">{metrics?.pendingListings || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <div className="text-xs text-rose-600 font-medium">Rejected</div>
          <div className="mt-1 text-xl font-bold text-rose-600">{metrics?.rejectedListings || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <div className="text-xs text-indigo-600 font-medium">New</div>
          <div className="mt-1 text-xl font-bold text-indigo-600">+{metrics?.newListings || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <div className="text-xs text-gray-500">Draft</div>
          <div className="mt-1 text-xl font-bold text-gray-700">{metrics?.draftListings || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <div className="text-xs text-gray-500">Expired</div>
          <div className="mt-1 text-xl font-bold text-gray-700">{metrics?.expiredListings || 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3.5 text-center shadow-sm">
          <div className="text-xs text-blue-600 font-medium">Sold</div>
          <div className="mt-1 text-xl font-bold text-blue-600">{metrics?.soldListings || 0}</div>
        </div>
      </div>

      {/* Top Listings Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Top Listings by Engagement</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3">Listing Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Seller</th>
                <th className="px-6 py-3 text-right">Price</th>
                <th className="px-6 py-3 text-center">Views</th>
                <th className="px-6 py-3 text-center">Favorites</th>
                <th className="px-6 py-3 text-center">Contacts</th>
                <th className="px-6 py-3 text-center">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700 bg-white">
              {!topListings || topListings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No listing data available.</td>
                </tr>
              ) : (
                topListings.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{l.title}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">{l.categoryName}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{l.sellerName}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium">{l.currency} {(l.price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-medium">{(l.views || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-indigo-600">{l.favorites}</td>
                    <td className="px-6 py-4 text-center text-purple-600 font-medium">{l.contacts}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{l.orders}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Low Performing Listings & Category Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low performing listings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Low-Performing Listings</h3>
          <div className="space-y-3">
            {!lowPerformingListings || lowPerformingListings.length === 0 ? (
              <p className="text-xs text-gray-400">No underperforming listings identified.</p>
            ) : (
              lowPerformingListings.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.views} views &middot; {item.favorites} favorites &middot; ETB {item.price}</div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    {item.issue}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Category Breakdown</h3>
          <div className="space-y-3">
            {categoryBreakdown?.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                  <div className="text-xs text-gray-500">{cat.listings} listings &middot; {cat.views} views</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold text-gray-900">ETB {(cat.avgPrice || 0).toLocaleString()}</div>
                  <div className="text-[11px] text-gray-400">avg price</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

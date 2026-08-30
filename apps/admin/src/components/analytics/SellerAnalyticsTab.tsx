'use client'

import React from 'react'
import type { SellerAnalyticsResponse } from '../../lib/adminApi'

interface SellerAnalyticsTabProps {
  data: SellerAnalyticsResponse | null
  loading: boolean
}

export default function SellerAnalyticsTab({ data, loading }: SellerAnalyticsTabProps) {
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

  const { metrics, healthIndicators, topSellers } = rawData

  return (
    <div className="space-y-6">
      {/* Seller Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Sellers</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">{(metrics?.totalSellers || 0).toLocaleString()}</div>
          <p className="mt-1 text-xs text-gray-500">Total vendor accounts</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Sellers</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{(metrics?.activeSellers || 0).toLocaleString()}</div>
          <p className="mt-1 text-xs text-gray-500">Active status</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verified Sellers</span>
          <div className="mt-2 text-2xl font-bold text-blue-600">{(metrics?.verifiedSellers || 0).toLocaleString()}</div>
          <p className="mt-1 text-xs text-gray-500">Verified designer badge</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Suspended</span>
          <div className="mt-2 text-2xl font-bold text-rose-600">{(metrics?.suspendedSellers || 0).toLocaleString()}</div>
          <p className="mt-1 text-xs text-gray-500">Moderated / suspended</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Listings / Seller</span>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{metrics?.avgListingsPerSeller || 0}</div>
          <p className="mt-1 text-xs text-gray-500">Inventory density</p>
        </div>
      </div>

      {/* Seller Health Indicators */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Seller Health Indicators</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
            <span className="text-xs font-medium text-emerald-800">Growing Sellers</span>
            <div className="mt-1 text-xl font-bold text-emerald-900">{healthIndicators?.growingSellers || 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <span className="text-xs font-medium text-gray-700">Inactive Sellers</span>
            <div className="mt-1 text-xl font-bold text-gray-900">{healthIndicators?.inactiveSellers || 0}</div>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
            <span className="text-xs font-medium text-amber-800">High View / Low Contact</span>
            <div className="mt-1 text-xl font-bold text-amber-900">{healthIndicators?.highViewLowContactSellers || 0}</div>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
            <span className="text-xs font-medium text-amber-800">High Contact / Low Order</span>
            <div className="mt-1 text-xl font-bold text-amber-900">{healthIndicators?.highContactLowOrderSellers || 0}</div>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
            <span className="text-xs font-medium text-rose-800">Declining Activity</span>
            <div className="mt-1 text-xl font-bold text-rose-900">{healthIndicators?.decliningSellers || 0}</div>
          </div>
        </div>
      </div>

      {/* Top Sellers Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Top Performing Sellers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3">Seller</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-center">Listings</th>
                <th className="px-6 py-3 text-center">Views</th>
                <th className="px-6 py-3 text-center">Contacts</th>
                <th className="px-6 py-3 text-center">Orders</th>
                <th className="px-6 py-3 text-right">GMV</th>
                <th className="px-6 py-3 text-center">Conv %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700 bg-white">
              {!topSellers || topSellers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No seller records available.</td>
                </tr>
              ) : (
                topSellers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
                        {s.sellerType || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{s.listings}</td>
                    <td className="px-6 py-4 text-center">{(s.views || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-medium text-indigo-600">{s.contacts}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{s.orders}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold">ETB {(s.gmv || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {s.conversionPct}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

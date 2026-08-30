'use client'

import React, { useEffect, useState } from 'react'
import AnalyticsDateRangePicker, { DateRangeState } from '../../../components/analytics/AnalyticsDateRangePicker'
import OverviewTab from '../../../components/analytics/OverviewTab'
import BuyerAnalyticsTab from '../../../components/analytics/BuyerAnalyticsTab'
import SellerAnalyticsTab from '../../../components/analytics/SellerAnalyticsTab'
import ListingAnalyticsTab from '../../../components/analytics/ListingAnalyticsTab'
import MarketplaceHealthTab from '../../../components/analytics/MarketplaceHealthTab'
import ReportsTab from '../../../components/analytics/ReportsTab'

import {
  fetchAnalyticsOverview,
  fetchBuyerAnalytics,
  fetchSellerAnalytics,
  fetchListingAnalytics,
  fetchMarketplaceHealth,
  type AnalyticsOverviewResponse,
  type BuyerAnalyticsResponse,
  type SellerAnalyticsResponse,
  type ListingAnalyticsResponse,
  type MarketplaceHealthResponse,
} from '../../../lib/adminApi'

type TabType = 'overview' | 'buyers' | 'sellers' | 'listings' | 'marketplace' | 'reports'

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [dateState, setDateState] = useState<DateRangeState>({
    range: '30d',
    compare: true,
  })

  // Data states
  const [overviewData, setOverviewData] = useState<AnalyticsOverviewResponse | null>(null)
  const [buyerData, setBuyerData] = useState<BuyerAnalyticsResponse | null>(null)
  const [sellerData, setSellerData] = useState<SellerAnalyticsResponse | null>(null)
  const [listingData, setListingData] = useState<ListingAnalyticsResponse | null>(null)
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceHealthResponse | null>(null)

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTabMetrics()
  }, [activeTab, dateState])

  const loadTabMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        range: dateState.range,
        from: dateState.from,
        to: dateState.to,
        compare: dateState.compare,
      }

      if (activeTab === 'overview') {
        const res = await fetchAnalyticsOverview(params)
        setOverviewData(res)
      } else if (activeTab === 'buyers') {
        const res = await fetchBuyerAnalytics(params)
        setBuyerData(res)
      } else if (activeTab === 'sellers') {
        const res = await fetchSellerAnalytics(params)
        setSellerData(res)
      } else if (activeTab === 'listings') {
        const res = await fetchListingAnalytics(params)
        setListingData(res)
      } else if (activeTab === 'marketplace') {
        const res = await fetchMarketplaceHealth(params)
        setMarketplaceData(res)
      }
    } catch (err) {
      console.error('Failed to load analytics metrics:', err)
      setError('Unable to fetch live analytics data. Please verify backend service.')
    } finally {
      setLoading(false)
    }
  }

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
        </svg>
      ),
    },
    {
      id: 'buyers',
      label: 'Buyers',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
    },
    {
      id: 'sellers',
      label: 'Sellers',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
    },
    {
      id: 'listings',
      label: 'Listings',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.25 6h13.5" />
        </svg>
      ),
    },
    {
      id: 'marketplace',
      label: 'Marketplace Health',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 0 5.814-5.518l2.74-1.22m0 0-3.976-4.035m3.976 4.035-4.035 3.976" />
        </svg>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Marketplace Analytics</h1>
          <p className="text-xs text-gray-500">Real-time measurement layer powered by application single-source-of-truth</p>
        </div>

        <button
          type="button"
          onClick={loadTabMetrics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Date Range & Controls */}
      <AnalyticsDateRangePicker value={dateState} onChange={setDateState} disabled={loading} />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap space-x-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Render Active Tab */}
      {activeTab === 'overview' && <OverviewTab data={overviewData} loading={loading} />}
      {activeTab === 'buyers' && <BuyerAnalyticsTab data={buyerData} loading={loading} />}
      {activeTab === 'sellers' && <SellerAnalyticsTab data={sellerData} loading={loading} />}
      {activeTab === 'listings' && <ListingAnalyticsTab data={listingData} loading={loading} />}
      {activeTab === 'marketplace' && <MarketplaceHealthTab data={marketplaceData} loading={loading} />}
      {activeTab === 'reports' && <ReportsTab rangeState={dateState} />}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'communication' | 'inventory' | 'vendor'>('communication')
  const [metrics, setMetrics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('30d')

  useEffect(() => {
    loadMetrics()
  }, [activeTab, timeRange])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API calls
      // const response = await getAnalyticsMetrics({ type: activeTab, timeRange })
      // if (response.success && response.data) {
      //   setMetrics(response.data)
      // }
      setMetrics({})
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last 1 year</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('communication')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'communication'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Communication Engagement
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'inventory'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Regional Inventory
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'vendor'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Vendor KPIs
          </button>
        </nav>
      </div>

      {/* Communication Engagement Metrics */}
      {activeTab === 'communication' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Total Messages</dt>
              <dd className="mt-2 text-3xl font-bold text-gray-900">
                {metrics.totalMessages || 0}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Response Rate</dt>
              <dd className="mt-2 text-3xl font-bold text-green-600">
                {metrics.responseRate || '0%'}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Avg Response Time</dt>
              <dd className="mt-2 text-3xl font-bold text-blue-600">
                {metrics.avgResponseTime || '0min'}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Active Conversations</dt>
              <dd className="mt-2 text-3xl font-bold text-indigo-600">
                {metrics.activeConversations || 0}
              </dd>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Volume Trend</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <span className="text-gray-400">Chart placeholder - Message volume over time</span>
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Distribution</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <span className="text-gray-400">Chart placeholder - Response time distribution</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regional Inventory Metrics */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Total Listings</dt>
              <dd className="mt-2 text-3xl font-bold text-gray-900">
                {metrics.totalListings || 0}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Active Regions</dt>
              <dd className="mt-2 text-3xl font-bold text-green-600">
                {metrics.activeRegions || 0}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Low Stock Alerts</dt>
              <dd className="mt-2 text-3xl font-bold text-red-600">
                {metrics.lowStockAlerts || 0}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">New Listings (30d)</dt>
              <dd className="mt-2 text-3xl font-bold text-blue-600">
                {metrics.newListings || 0}
              </dd>
            </div>
          </div>

          <div className="rounded-lg bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Inventory by Region</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total Listings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sold (30d)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No regional data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vendor KPIs */}
      {activeTab === 'vendor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Total Vendors</dt>
              <dd className="mt-2 text-3xl font-bold text-gray-900">
                {metrics.totalVendors || 0}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Active Vendors</dt>
              <dd className="mt-2 text-3xl font-bold text-green-600">
                {metrics.activeVendors || 0}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Verified Vendors</dt>
              <dd className="mt-2 text-3xl font-bold text-blue-600">
                {metrics.verifiedVendors || 0}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Top Performers</dt>
              <dd className="mt-2 text-3xl font-bold text-indigo-600">
                {metrics.topPerformers || 0}
              </dd>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Performance Ranking</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div key={rank} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                        {rank}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">Vendor {rank}</div>
                        <div className="text-xs text-gray-500">vendor{rank}@example.com</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">9{rank}.5%</div>
                      <div className="text-xs text-gray-500">Performance Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Categories Distribution</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <span className="text-gray-400">Chart placeholder - Vendor categories</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Vendor KPI Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Listings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Response Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No vendor data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

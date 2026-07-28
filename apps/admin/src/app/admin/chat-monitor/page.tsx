'use client'

import { useEffect, useState } from 'react'

export default function ChatMonitorPage() {
  const [activeTab, setActiveTab] = useState<'health' | 'response' | 'active'>('health')
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('1h')

  useEffect(() => {
    loadMetrics()
  }, [activeTab, timeRange])
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadMetrics()
    }, 5000)
    return () => clearInterval(interval)
  }, [activeTab, timeRange])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API calls
      // const response = await getChatMetrics({ type: activeTab, timeRange })
      // if (response.success && response.data) {
      //   setMetrics(response.data)
      // }
      setMetrics([])
    } catch (error) {
      console.error('Failed to load chat metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'down':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Chat Monitor</h1>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('health')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'health'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Socket.IO Health
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'response'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Seller Response Tracking
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'active'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Active Conversations
          </button>
        </nav>
      </div>

      {/* Time Range Filter */}
      <div className="flex items-center gap-4">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="5m">Last 5 minutes</option>
          <option value="15m">Last 15 minutes</option>
          <option value="1h">Last 1 hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Active Connections</dt>
          <dd className="mt-2 text-3xl font-bold text-green-600">
            {metrics.length > 0 ? metrics[0].activeConnections || 0 : 0}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Messages/min</dt>
          <dd className="mt-2 text-3xl font-bold text-blue-600">
            {metrics.length > 0 ? metrics[0].messagesPerMinute || 0 : 0}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Avg Response Time</dt>
          <dd className="mt-2 text-3xl font-bold text-indigo-600">
            {metrics.length > 0 ? `${metrics[0].avgResponseTime || 0}ms` : '0ms'}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">System Status</dt>
          <dd className="mt-2 text-3xl font-bold">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor('healthy')}`}>
              Healthy
            </span>
          </dd>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Server
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Connections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Messages/sec
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : metrics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No metrics available
                  </td>
                </tr>
              ) : (
                metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {metric.serverName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {metric.connections}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {metric.messagesPerSecond}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {metric.latency}ms
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {metric.uptime}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(metric.lastUpdated).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seller Response Tracking Section */}
      {activeTab === 'response' && (
        <div className="rounded-lg bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller Response Performance</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded bg-gray-50 p-4">
              <dt className="text-sm font-medium text-gray-500">Fast Responders (&lt;5min)</dt>
              <dd className="mt-2 text-2xl font-bold text-green-600">85%</dd>
            </div>
            <div className="rounded bg-gray-50 p-4">
              <dt className="text-sm font-medium text-gray-500">Average Response Time</dt>
              <dd className="mt-2 text-2xl font-bold text-blue-600">3.2 min</dd>
            </div>
            <div className="rounded bg-gray-50 p-4">
              <dt className="text-sm font-medium text-gray-500">Unanswered Messages</dt>
              <dd className="mt-2 text-2xl font-bold text-red-600">12</dd>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

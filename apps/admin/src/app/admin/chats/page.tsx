'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Shield, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ChatMetrics {
  totalConversations: number
  flaggedConversations: number
  highRiskConversations: number
  pendingReviews: number
  resolvedToday: number
}

interface FlaggedThread {
  id: string
  buyerId: string
  sellerId: string
  listingId: string | null
  isFlagged: boolean
  riskScore: number
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  buyer: {
    id: string
    displayName: string
    email: string
    avatarUrl: string | null
  }
  seller: {
    id: string
    displayName: string
    email: string
    avatarUrl: string | null
  }
  listing: {
    id: string
    title: string
    slug: string
  } | null
  flagLogs: Array<{
    id: string
    reason: string
    keywordTriggered: string | null
    status: string
    createdAt: string
  }>
}

export default function AdminChatsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'high_risk' | 'resolved' | 'suspended'>('flagged')
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null)
  const [threads, setThreads] = useState<FlaggedThread[]>([])
  const [selectedThread, setSelectedThread] = useState<FlaggedThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadMetrics()
    loadThreads()
  }, [activeTab, page])

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/v1/admin/chats/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  const loadThreads = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/admin/chats/threads?filter=${activeTab}&page=${page}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to load threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 50) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          <AlertTriangle className="mr-1 h-3 w-3" />
          High Risk
        </span>
      )
    }
    if (riskScore >= 25) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          <AlertCircle className="mr-1 h-3 w-3" />
          Medium Risk
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <CheckCircle className="mr-1 h-3 w-3" />
        Low Risk
      </span>
    )
  }

  const getFlagStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </span>
        )
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Resolved
          </span>
        )
      case 'DISMISSED':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            <XCircle className="mr-1 h-3 w-3" />
            Dismissed
          </span>
        )
      case 'USER_BANNED':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <Shield className="mr-1 h-3 w-3" />
            User Banned
          </span>
        )
      case 'USER_WARNED':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            User Warned
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Safety Center</h1>
          <p className="text-sm text-gray-500">Monitor flagged conversations and enforce safety policies</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-gray-600">Live Monitoring</span>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Conversations
            </dt>
            <dd className="mt-2 text-3xl font-bold text-gray-900">{metrics.totalConversations}</dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Flagged Threads
            </dt>
            <dd className="mt-2 text-3xl font-bold text-orange-600">{metrics.flaggedConversations}</dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              High Risk
            </dt>
            <dd className="mt-2 text-3xl font-bold text-red-600">{metrics.highRiskConversations}</dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Reviews
            </dt>
            <dd className="mt-2 text-3xl font-bold text-yellow-600">{metrics.pendingReviews}</dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resolved Today
            </dt>
            <dd className="mt-2 text-3xl font-bold text-green-600">{metrics.resolvedToday}</dd>
          </div>
        </div>
      )}

      {/* Tabbed Filter Bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab('all'); setPage(1) }}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            All Threads
          </button>
          <button
            onClick={() => { setActiveTab('flagged'); setPage(1) }}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'flagged'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Flagged & High Risk
          </button>
          <button
            onClick={() => { setActiveTab('resolved'); setPage(1) }}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'resolved'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => { setActiveTab('suspended'); setPage(1) }}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'suspended'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Suspended Accounts
          </button>
        </nav>
      </div>

      {/* Threads Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Thread ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Flag Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
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
              ) : threads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No threads found
                  </td>
                </tr>
              ) : (
                threads.map((thread) => (
                  <tr key={thread.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {thread.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-900">Buyer: {thread.buyer.displayName}</div>
                        <div className="text-xs text-gray-500">Seller: {thread.seller.displayName}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {thread.listing ? (
                        <a
                          href={`/listings/${thread.listing.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {thread.listing.title}
                        </a>
                      ) : (
                        <span className="text-gray-400">No product</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {getRiskBadge(thread.riskScore)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {thread.flagLogs.length > 0 && thread.flagLogs[0]?.status && getFlagStatusBadge(thread.flagLogs[0].status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(thread.lastMessageAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedThread(thread)}
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        Inspect Thread
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Audit Drawer */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedThread(null)}></div>
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl">
              <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                <div className="px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Thread Audit</h2>
                    <button
                      onClick={() => setSelectedThread(null)}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                  <div className="space-y-6">
                    {/* Thread Details */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Thread Details</h3>
                      <dl className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-gray-500">Thread ID</dt>
                          <dd className="text-gray-900">{selectedThread.id}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Risk Score</dt>
                          <dd>{getRiskBadge(selectedThread.riskScore)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Buyer</dt>
                          <dd className="text-gray-900">{selectedThread.buyer.displayName}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Seller</dt>
                          <dd className="text-gray-900">{selectedThread.seller.displayName}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Last Activity</dt>
                          <dd className="text-gray-900">{formatDate(selectedThread.lastMessageAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Created</dt>
                          <dd className="text-gray-900">{formatDate(selectedThread.createdAt)}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Flag Logs */}
                    {selectedThread.flagLogs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Flag History</h3>
                        <div className="mt-2 space-y-2">
                          {selectedThread.flagLogs.map((log) => (
                            <div key={log.id} className="rounded-md bg-gray-50 p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">{log.reason}</span>
                                {getFlagStatusBadge(log.status)}
                              </div>
                              {log.keywordTriggered && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Triggered keyword: <span className="font-mono text-red-600">{log.keywordTriggered}</span>
                                </p>
                              )}
                              <p className="mt-1 text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product Link */}
                    {selectedThread.listing && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Associated Product</h3>
                        <a
                          href={`/listings/${selectedThread.listing.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          View Product: {selectedThread.listing.title}
                        </a>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleResolve(selectedThread.id, 'DISMISS')}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Dismiss Flag & Clear Risk
                      </button>
                      <button
                        onClick={() => handleResolve(selectedThread.id, 'WARN_USER')}
                        className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                      >
                        Issue Official Platform Warning
                      </button>
                      <button
                        onClick={() => handleResolve(selectedThread.id, 'BAN_USER')}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Ban / Suspend User Account
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      All actions are logged in the audit trail. Banning users will immediately restrict their platform access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  async function handleResolve(conversationId: string, action: 'DISMISS' | 'WARN_USER' | 'BAN_USER') {
    const reason = prompt(`Please provide a reason for ${action.replace('_', ' ')}:`)
    if (!reason) return

    try {
      const response = await fetch(`/api/v1/admin/chats/threads/${conversationId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: 'current-admin-id', action, reason }),
      })

      if (response.ok) {
        alert('Action completed successfully')
        setSelectedThread(null)
        loadThreads()
        loadMetrics()
      } else {
        alert('Failed to complete action')
      }
    } catch (error) {
      console.error('Failed to resolve thread:', error)
      alert('Failed to complete action')
    }
  }
}

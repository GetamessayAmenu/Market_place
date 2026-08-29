'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface ReportItem {
  id: string
  targetType: 'listing' | 'user' | 'message' | 'conversation'
  reason: string
  description: string | null
  status: 'pending' | 'under_review' | 'investigating' | 'resolved' | 'dismissed' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  reporter: { id: string; displayName: string; email: string; avatarUrl: string | null }
  reportedUser: { id: string; displayName: string; email: string; status: string } | null
  listing: { id: string; title: string; slug: string; status: string } | null
  message: { id: string; body: string; createdAt: string } | null
  assignedAdmin: { id: string; displayName: string; email: string } | null
  resolvedBy: { id: string; displayName: string } | null
  conversation?: {
    id: string
    buyer: { id: string; displayName: string }
    seller: { id: string; displayName: string }
  } | null
}

export default function AdminChatReportsV1Page() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 15

  // V1 Filters
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')
  const [targetType, setTargetType] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  useEffect(() => {
    loadReports()
  }, [page, status, priority, targetType, reason])

  const loadReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (status) params.set('status', status)
      if (priority) params.set('priority', priority)
      if (targetType) params.set('targetType', targetType)
      if (reason) params.set('reason', reason)
      if (search) params.set('search', search)

      const res = await fetch(`/api/v1/reports?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.data || data.items || [])
        setTotal(data.meta?.total || data.total || 0)
      }
    } catch (err) {
      console.error('Failed to load reports queue:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadReports()
  }

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800"><AlertTriangle className="h-3 w-3" /> Critical</span>
      case 'high':
        return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800"><AlertCircle className="h-3 w-3" /> High</span>
      case 'medium':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Medium</span>
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">Low</span>
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20"><Clock className="h-3 w-3" /> New</span>
      case 'under_review':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20">Under Review</span>
      case 'investigating':
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-600/20">Escalated</span>
      case 'resolved':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20"><CheckCircle className="h-3 w-3" /> Resolved</span>
      case 'dismissed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"><XCircle className="h-3 w-3" /> Dismissed</span>
      case 'closed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-800">Closed</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chat Moderation Reports</h1>
          <p className="text-sm text-gray-500">Review reported messages, user violations, and moderation actions</p>
        </div>
        <button
          onClick={loadReports}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Refresh Queue
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Quick Filter Buttons */}
          <button
            onClick={() => { setStatus(''); setPage(1) }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${!status ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Statuses
          </button>
          <button
            onClick={() => { setStatus('pending'); setPage(1) }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${status === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
          >
            New
          </button>
          <button
            onClick={() => { setStatus('under_review'); setPage(1) }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${status === 'under_review' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}
          >
            Under Review
          </button>
          <button
            onClick={() => { setStatus('investigating'); setPage(1) }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${status === 'investigating' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}
          >
            Escalated
          </button>
          <button
            onClick={() => { setStatus('resolved'); setPage(1) }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
          >
            Resolved
          </button>
          <button
            onClick={() => { setStatus('dismissed'); setPage(1) }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${status === 'dismissed' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Dismissed
          </button>
        </div>

        {/* Detailed Dropdown Filters & Search */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1) }}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value); setPage(1) }}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Target Types</option>
            <option value="message">Message</option>
            <option value="conversation">Conversation</option>
            <option value="user">User</option>
            <option value="listing">Listing</option>
          </select>

          <select
            value={reason}
            onChange={(e) => { setReason(e.target.value); setPage(1) }}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Reasons</option>
            <option value="Spam">Spam</option>
            <option value="Scam">Scam</option>
            <option value="Harassment">Harassment</option>
            <option value="Fraud">Fraud</option>
            <option value="Suspicious behavior">Suspicious behavior</option>
            <option value="Inappropriate content">Inappropriate content</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="col-span-1 lg:col-span-2 relative flex items-center">
            <input
              type="text"
              placeholder="Search by user name, email or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-9 pr-20 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none"
            />
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <button
              type="submit"
              className="absolute right-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* V1 Reports Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Report</th>
                <th className="px-6 py-3.5">Reporter</th>
                <th className="px-6 py-3.5">Reported User</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">Loading reports queue...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No reports match the selected filters
                  </td>
                </tr>
              ) : (
                reports.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="whitespace-nowrap px-6 py-4">{getPriorityBadge(item.priority)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-mono font-bold text-gray-900">#{item.id.slice(0, 8)}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{item.targetType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.reporter?.displayName}</div>
                      <div className="text-[11px] text-gray-400">{item.reporter?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {item.reportedUser ? (
                        <div>
                          <div className="font-semibold text-gray-900">{item.reportedUser.displayName}</div>
                          <div className="text-[11px] text-gray-400">{item.reportedUser.email}</div>
                        </div>
                      ) : item.listing ? (
                        <div className="text-indigo-600 font-semibold">{item.listing.title}</div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{item.reason}</span>
                      {item.description && (
                        <p className="line-clamp-1 text-[11px] text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/admin/chat/reports/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                      >
                        Inspect Report →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Mobile Cards */}
        <div className="block md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading queue...</div>
          ) : reports.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No reports found</div>
          ) : (
            reports.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  {getPriorityBadge(item.priority)}
                  {getStatusBadge(item.status)}
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-gray-900">ID: #{item.id.slice(0, 8)}</span>
                  <p className="text-xs font-semibold text-gray-900 mt-1">Reason: {item.reason}</p>
                  <p className="text-xs text-gray-500">Reporter: {item.reporter?.displayName}</p>
                  {item.reportedUser && (
                    <p className="text-xs text-gray-500">Reported User: {item.reportedUser.displayName}</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <Link
                    href={`/admin/chat/reports/${item.id}`}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                  >
                    Inspect Report →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {total > limit && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} reports
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

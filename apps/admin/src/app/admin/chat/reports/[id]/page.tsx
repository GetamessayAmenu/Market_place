'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface DetailedReport {
  id: string
  targetType: string
  reason: string
  description: string | null
  status: 'pending' | 'under_review' | 'investigating' | 'resolved' | 'dismissed' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  resolutionNote: string | null
  reporterId: string
  reportedUserId: string | null
  conversationId: string | null
  messageId: string | null
  listingId: string | null
  reporter: { id: string; displayName: string; email: string; avatarUrl: string | null }
  reportedUser: { id: string; displayName: string; email: string; status: string; avatarUrl: string | null } | null
  listing: { id: string; title: string; slug: string; status: string; price: number } | null
  message: { id: string; body: string; createdAt: string; senderId: string } | null
  assignedAdmin: { id: string; displayName: string; email: string } | null
  resolvedBy: { id: string; displayName: string } | null
  conversation: {
    id: string
    buyerId: string
    sellerId: string
    createdAt: string
    lastMessageAt: string | null
    buyer: { id: string; displayName: string; email: string }
    seller: { id: string; displayName: string; email: string }
    listing: { id: string; title: string; slug: string; status: string } | null
  } | null
}

interface MessageStreamItem {
  id: string
  senderId: string
  body: string
  createdAt: string
  deletedAt?: string | null
  sender: { id: string; displayName: string; email: string }
}

export default function ReportedConversationViewerV1Page() {
  const params = useParams()
  const reportId = params.id as string

  const [report, setReport] = useState<DetailedReport | null>(null)
  const [messages, setMessages] = useState<MessageStreamItem[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // V1 Action Modal State
  const [actionType, setActionType] = useState<
    'RESOLVE' | 'DISMISS' | 'ESCALATE' | 'WARN' | 'RESTRICT_TEMP' | 'RESTRICT_PERM' | null
  >(null)
  const [actionReason, setActionReason] = useState('')
  const [tempDurationDays, setTempDurationDays] = useState(7)
  const [actionSubmitting, setActionSubmitting] = useState(false)

  useEffect(() => {
    loadReportDetails()
  }, [reportId])

  const loadReportDetails = async () => {
    try {
      setLoading(true)
      const rRes = await fetch(`/api/v1/reports/${reportId}`)
      if (!rRes.ok) {
        throw new Error('Report not found')
      }
      const rData = await rRes.json()
      setReport(rData)

      // Load conversation history if attached to report
      if (rData.conversationId) {
        const cRes = await fetch(`/api/v1/reports/${reportId}/conversation`)
        if (cRes.ok) {
          const cData = await cRes.json()
          setMessages(cData)
        }
      }

      // Load immutable audit log history
      const aRes = await fetch(`/api/v1/reports/${reportId}/audit-logs`)
      if (aRes.ok) {
        const aData = await aRes.json()
        setAuditLogs(aData)
      }
    } catch (err) {
      console.error('Failed to load report details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteAction = async () => {
    if (!actionType || !report) return
    if (!actionReason && actionType !== 'RESOLVE' && actionType !== 'DISMISS') {
      alert('Please enter a reason or note for this action.')
      return
    }

    setActionSubmitting(true)
    try {
      if (actionType === 'RESOLVE') {
        await fetch(`/api/v1/reports/${reportId}/resolve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution: 'resolved', resolutionNote: actionReason || 'Issue resolved' }),
        })
        alert('Report marked as Resolved')
      } else if (actionType === 'DISMISS') {
        await fetch(`/api/v1/reports/${reportId}/resolve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution: 'dismissed', resolutionNote: actionReason || 'Report dismissed' }),
        })
        alert('Report Dismissed')
      } else if (actionType === 'ESCALATE') {
        await fetch(`/api/v1/reports/${reportId}/escalate`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: actionReason }),
        })
        alert('Report Escalated to Senior Moderator')
      } else if (actionType === 'WARN') {
        if (report.conversationId) {
          await fetch(`/api/v1/admin/chats/threads/${report.conversationId}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: 'current-admin', action: 'WARN_USER', reason: actionReason }),
          })
        }
        alert('Official warning issued to user')
      } else if (actionType === 'RESTRICT_TEMP' || actionType === 'RESTRICT_PERM') {
        const targetUserId = report.reportedUserId || report.reporterId
        const expiresAt = actionType === 'RESTRICT_TEMP'
          ? new Date(Date.now() + tempDurationDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined

        const res = await fetch(`/api/v1/admin/chats/users/${targetUserId}/restrict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: actionType === 'RESTRICT_TEMP' ? 'temporary' : 'permanent',
            reason: actionReason,
            expiresAt,
          }),
        })
        if (res.ok) alert('Messaging restriction applied successfully')
      }

      setActionType(null)
      setActionReason('')
      loadReportDetails()
    } catch (err) {
      console.error('Failed to execute moderation action:', err)
      alert('Action failed')
    } finally {
      setActionSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading report viewer...</div>
  }

  if (!report) {
    return <div className="p-8 text-center text-sm text-gray-500">Report not found</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/chat"
            className="rounded-xl border border-gray-300 bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Report Investigation #{report.id.slice(0, 8)}
            </h1>
            <p className="text-xs text-gray-500">Filed on {new Date(report.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Priority: {report.priority.toUpperCase()}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
            Status: {report.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Grid: Details Sidebar & Message History Box */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Reporter, Reported User, Listing, V1 Actions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Report Information Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Report Details
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400">Reason:</span>
                <span className="ml-2 font-semibold text-gray-900">{report.reason}</span>
              </div>
              {report.description && (
                <div>
                  <span className="text-gray-400">Description:</span>
                  <p className="mt-1 rounded-xl bg-gray-50 p-2.5 text-gray-700">{report.description}</p>
                </div>
              )}
              <div>
                <span className="text-gray-400">Reporter:</span>
                <span className="ml-2 font-medium text-gray-900">{report.reporter.displayName} ({report.reporter.email})</span>
              </div>
              <div>
                <span className="text-gray-400">Reported User:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {report.reportedUser ? `${report.reportedUser.displayName} (${report.reportedUser.email})` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Context Card */}
          {report.conversation && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Context & Product
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-400">Buyer:</span>
                  <span className="ml-2 font-medium text-gray-900">{report.conversation.buyer.displayName}</span>
                </div>
                <div>
                  <span className="text-gray-400">Seller:</span>
                  <span className="ml-2 font-medium text-gray-900">{report.conversation.seller.displayName}</span>
                </div>
                {report.listing && (
                  <div>
                    <span className="text-gray-400">Product:</span>
                    <a
                      href={`/listings/${report.listing.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 font-semibold text-indigo-600 hover:underline"
                    >
                      {report.listing.title}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* V1 Moderation Actions Panel */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900">V1 Moderation Actions</h3>
            <p className="text-xs text-gray-500">Take immediate action with audit logging</p>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={() => setActionType('RESOLVE')}
                className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Resolve Report
              </button>

              <button
                onClick={() => setActionType('DISMISS')}
                className="w-full rounded-xl bg-gray-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-700"
              >
                Dismiss Report
              </button>

              <button
                onClick={() => setActionType('ESCALATE')}
                className="w-full rounded-xl border border-purple-300 bg-purple-50 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100"
              >
                Escalate Report
              </button>

              <button
                onClick={() => setActionType('WARN')}
                className="w-full rounded-xl bg-amber-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                Warn User
              </button>

              <button
                onClick={() => setActionType('RESTRICT_TEMP')}
                className="w-full rounded-xl bg-orange-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-700"
              >
                Restrict Messaging (Temporary)
              </button>

              <button
                onClick={() => setActionType('RESTRICT_PERM')}
                className="w-full rounded-xl bg-red-700 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-800"
              >
                Restrict Messaging (Permanent)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Message Stream Box with Highlighted Message & Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Conversation Message Stream</h3>
                <p className="text-xs text-gray-500">
                  Inspecting thread around reported message ({messages.length} messages)
                </p>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800 border border-red-200">
                Reported message highlighted below
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  No conversation messages available for this report
                </div>
              ) : (
                messages.map((msg) => {
                  const isReportedMessage = msg.id === report.messageId
                  return (
                    <div
                      key={msg.id}
                      className={`rounded-2xl p-4 transition ${
                        isReportedMessage
                          ? 'border-2 border-red-500 bg-red-50/70 shadow-md ring-2 ring-red-500/20'
                          : 'border border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{msg.sender?.displayName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({msg.sender?.email})</span>
                          {isReportedMessage && (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                              ★ Highlighted Reported Message
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className={`text-xs leading-relaxed ${isReportedMessage ? 'font-bold text-red-950' : 'text-gray-800'}`}>
                        {msg.body}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Audit Log Box */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Report Audit Trail</h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400">No previous moderation actions recorded for this report</p>
            ) : (
              <div className="space-y-2 text-xs">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5">
                    <div>
                      <span className="font-semibold text-gray-900">{log.action}</span>
                      <span className="text-gray-500 ml-2">by Admin {log.actorId.slice(0, 8)}</span>
                    </div>
                    <span className="text-gray-400 text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Confirm Action: {actionType.replace('_', ' ')}
            </h3>
            <p className="text-xs text-gray-500">
              This moderation action will be recorded in the audit log.
            </p>

            {actionType === 'RESTRICT_TEMP' && (
              <div>
                <label className="text-xs font-semibold text-gray-700">Duration (Days):</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={tempDurationDays}
                    onChange={(e) => setTempDurationDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTempDurationDays(1)}
                    className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700"
                  >
                    1d
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempDurationDays(7)}
                    className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700"
                  >
                    7d
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempDurationDays(30)}
                    className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700"
                  >
                    30d
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-700">Audit Justification / Note:</label>
              <textarea
                rows={3}
                placeholder="Enter justification for this moderation decision..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-xs text-gray-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionType(null)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={actionSubmitting}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionSubmitting ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

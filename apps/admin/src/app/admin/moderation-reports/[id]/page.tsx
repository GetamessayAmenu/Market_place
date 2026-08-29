'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Package,
  MessageSquare,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  FileText,
  Send,
} from 'lucide-react'

interface DetailedReport {
  id: string
  targetType: 'user' | 'listing' | 'message' | 'conversation' | 'order' | 'rental' | 'custom_order' | 'other'
  reason: string
  description: string | null
  status: 'pending' | 'under_review' | 'investigating' | 'resolved' | 'dismissed' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  updatedAt: string
  resolutionNote: string | null
  reporterId: string
  reportedUserId: string | null
  conversationId: string | null
  messageId: string | null
  listingId: string | null
  orderId: string | null
  rentalId: string | null
  customOrderId: string | null
  assignedAdminId: string | null
  reporter: { id: string; displayName: string; email: string; avatarUrl: string | null }
  reportedUser: { id: string; displayName: string; email: string; status: string; avatarUrl: string | null } | null
  listing: { id: string; title: string; slug: string; status: string; price: number } | null
  message: { id: string; body: string; createdAt: string; senderId: string } | null
  order: { id: string; orderNumber: string; status: string; agreedPrice: number } | null
  rental: { id: string; orderNumber: string; status: string; totalAmount: number } | null
  customOrder: { id: string; status: string; agreedPrice: number } | null
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

export default function UnifiedReportDetailInvestigationPage() {
  const params = useParams()
  const reportId = params.id as string

  const [report, setReport] = useState<DetailedReport | null>(null)
  const [messages, setMessages] = useState<MessageStreamItem[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Internal Notes State
  const [newNote, setNewNote] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  // Action Modal State
  const [actionType, setActionType] = useState<
    | 'RESOLVE'
    | 'DISMISS'
    | 'ESCALATE'
    | 'WARN_USER'
    | 'WARN_SELLER'
    | 'RESTRICT_TEMP'
    | 'RESTRICT_PERM'
    | 'HIDE_LISTING'
    | 'SUSPEND_USER'
    | null
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

      // Load conversation history if attached
      if (rData.conversationId) {
        const cRes = await fetch(`/api/v1/reports/${reportId}/conversation`)
        if (cRes.ok) {
          const cData = await cRes.json()
          setMessages(cData)
        }
      }

      // Load audit logs history
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

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || !report) return

    setNoteSubmitting(true)
    try {
      const res = await fetch(`/api/v1/reports/${reportId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      })
      if (res.ok) {
        setNewNote('')
        // Refresh audit log to reflect internal note
        const aRes = await fetch(`/api/v1/reports/${reportId}/audit-logs`)
        if (aRes.ok) {
          const aData = await aRes.json()
          setAuditLogs(aData)
        }
      }
    } catch (err) {
      console.error('Failed to add internal note:', err)
    } finally {
      setNoteSubmitting(false)
    }
  }

  const handleExecuteAction = async () => {
    if (!actionType || !report) return
    if (!actionReason && actionType !== 'RESOLVE' && actionType !== 'DISMISS') {
      alert('Please enter a justification for this moderation decision.')
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
        alert('Report Escalated')
      } else {
        // Generic contextual action endpoint
        await fetch(`/api/v1/reports/${reportId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionType,
            note: actionReason,
            durationDays: actionType === 'RESTRICT_TEMP' ? tempDurationDays : undefined,
          }),
        })

        // Also issue user restriction if requested
        if ((actionType === 'RESTRICT_TEMP' || actionType === 'RESTRICT_PERM') && (report.reportedUserId || report.reporterId)) {
          const targetUserId = report.reportedUserId || report.reporterId
          const expiresAt = actionType === 'RESTRICT_TEMP'
            ? new Date(Date.now() + tempDurationDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined

          await fetch(`/api/v1/admin/chats/users/${targetUserId}/restrict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: actionType === 'RESTRICT_TEMP' ? 'temporary' : 'permanent',
              reason: actionReason,
              expiresAt,
            }),
          })
        }

        alert(`Moderation action (${actionType.replace('_', ' ')}) completed and audited.`)
      }

      setActionType(null)
      setActionReason('')
      loadReportDetails()
    } catch (err) {
      console.error('Failed to execute action:', err)
      alert('Action failed')
    } finally {
      setActionSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-600" />
      case 'listing':
        return <Package className="h-4 w-4 text-emerald-600" />
      case 'message':
      case 'conversation':
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-indigo-600" />
      case 'order':
        return <ShoppingBag className="h-4 w-4 text-purple-600" />
      case 'rental':
        return <RotateCcw className="h-4 w-4 text-amber-600" />
      case 'custom_order':
        return <Sparkles className="h-4 w-4 text-pink-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading report details...</div>
  }

  if (!report) {
    return <div className="p-8 text-center text-sm text-gray-500">Report not found</div>
  }

  const isChatReport = report.targetType === 'message' || report.targetType === 'conversation'
  const isListingReport = report.targetType === 'listing'
  const isUserReport = report.targetType === 'user'
  const isOrderReport = report.targetType === 'order' || report.targetType === 'rental' || report.targetType === 'custom_order'

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/moderation-reports"
            className="rounded-xl border border-gray-300 bg-white p-2.5 text-gray-600 shadow-sm hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-800 capitalize">
                {getTypeIcon(report.targetType)}
                {report.targetType.replace('_', ' ')} Report
              </span>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                #{report.id.slice(0, 8)}
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Filed on {new Date(report.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
            Priority: {report.priority.toUpperCase()}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-800 border border-gray-200">
            Status: {report.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Grid: Summary Sidebar & Evidence Context */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Report Overview, Reporter/Reported Info, Internal Notes */}
        <div className="space-y-6 lg:col-span-1">
          {/* Summary Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Report Overview
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400">Reason:</span>
                <p className="mt-0.5 font-bold text-gray-900 text-sm">{report.reason}</p>
              </div>

              {report.description && (
                <div>
                  <span className="text-gray-400">Description:</span>
                  <p className="mt-1 rounded-xl bg-gray-50 p-3 text-gray-700 leading-relaxed">
                    {report.description}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div>
                  <span className="text-gray-400">Reporter:</span>
                  <div className="font-semibold text-gray-900">{report.reporter.displayName}</div>
                  <div className="text-[11px] text-gray-400">{report.reporter.email}</div>
                </div>

                {report.reportedUser && (
                  <div>
                    <span className="text-gray-400">Reported User:</span>
                    <div className="font-semibold text-gray-900">{report.reportedUser.displayName}</div>
                    <div className="text-[11px] text-gray-400">{report.reportedUser.email}</div>
                  </div>
                )}

                {report.assignedAdmin && (
                  <div>
                    <span className="text-gray-400">Assigned Admin:</span>
                    <div className="font-semibold text-indigo-600">{report.assignedAdmin.displayName}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contextual Actions Panel */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Moderation Actions</h3>
              <p className="text-xs text-gray-500">Available actions tailored for {report.targetType.replace('_', ' ')} reports</p>
            </div>

            <div className="space-y-2">
              {/* Type Specific Action Buttons */}
              {isListingReport && (
                <>
                  <button
                    onClick={() => setActionType('HIDE_LISTING')}
                    className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                  >
                    Hide / Unpublish Listing
                  </button>
                  <button
                    onClick={() => setActionType('WARN_SELLER')}
                    className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-700"
                  >
                    Issue Warning to Seller
                  </button>
                </>
              )}

              {isUserReport && (
                <>
                  <button
                    onClick={() => setActionType('WARN_USER')}
                    className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                  >
                    Issue Official Warning to User
                  </button>
                  <button
                    onClick={() => setActionType('SUSPEND_USER')}
                    className="w-full rounded-xl bg-red-700 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-800"
                  >
                    Suspend User Account
                  </button>
                </>
              )}

              {isChatReport && (
                <>
                  <button
                    onClick={() => setActionType('WARN_USER')}
                    className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                  >
                    Issue Official Warning
                  </button>
                  <button
                    onClick={() => setActionType('RESTRICT_TEMP')}
                    className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-700"
                  >
                    Restrict Messaging (Temporary)
                  </button>
                  <button
                    onClick={() => setActionType('RESTRICT_PERM')}
                    className="w-full rounded-xl bg-red-700 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-800"
                  >
                    Restrict Messaging (Permanent)
                  </button>
                </>
              )}

              {isOrderReport && (
                <>
                  <button
                    onClick={() => setActionType('WARN_USER')}
                    className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                  >
                    Warn Party Involved
                  </button>
                </>
              )}

              {/* General Workflow Action Buttons */}
              <div className="border-t border-indigo-100 pt-3 space-y-2">
                <button
                  onClick={() => setActionType('RESOLVE')}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Resolve Report
                </button>

                <button
                  onClick={() => setActionType('DISMISS')}
                  className="w-full rounded-xl bg-gray-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-700"
                >
                  Dismiss Report
                </button>

                <button
                  onClick={() => setActionType('ESCALATE')}
                  className="w-full rounded-xl border border-purple-300 bg-purple-50 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                >
                  Escalate Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Evidence & Context + Audit Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Context / Evidence Display Panel */}
          {isChatReport && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col h-[550px]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Reported Chat Message Stream</h3>
                  <p className="text-xs text-gray-500">
                    Showing conversation history ({messages.length} messages)
                  </p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-800 border border-red-200">
                  ★ Highlighted Reported Message
                </span>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    No conversation stream available for this report
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isReported = msg.id === report.messageId
                    return (
                      <div
                        key={msg.id}
                        className={`rounded-2xl p-4 transition ${
                          isReported
                            ? 'border-2 border-red-500 bg-red-50/80 shadow-md ring-2 ring-red-500/20'
                            : 'border border-gray-100 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{msg.sender?.displayName}</span>
                            <span className="text-[10px] text-gray-400 font-mono">({msg.sender?.email})</span>
                            {isReported && (
                              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                Reported Message
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className={`text-xs leading-relaxed ${isReported ? 'font-bold text-red-950 text-sm' : 'text-gray-800'}`}>
                          {msg.body}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Listing Report Preview */}
          {isListingReport && report.listing && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Reported Listing Evidence
              </h3>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-900">{report.listing.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">Status: {report.listing.status.toUpperCase()}</p>
                  <p className="text-sm font-semibold text-emerald-600 mt-1">${report.listing.price}</p>
                </div>
                <a
                  href={`/listings/${report.listing.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 text-center"
                >
                  View Listing Preview →
                </a>
              </div>
            </div>
          )}

          {/* User Report Preview */}
          {isUserReport && report.reportedUser && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Reported User Profile Evidence
              </h3>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-2 text-xs">
                <div>
                  <span className="text-gray-400">Display Name:</span>
                  <span className="ml-2 font-bold text-gray-900">{report.reportedUser.displayName}</span>
                </div>
                <div>
                  <span className="text-gray-400">Email Address:</span>
                  <span className="ml-2 font-mono text-gray-900">{report.reportedUser.email}</span>
                </div>
                <div>
                  <span className="text-gray-400">Account Status:</span>
                  <span className="ml-2 font-semibold uppercase text-amber-700">{report.reportedUser.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Report Preview */}
          {isOrderReport && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Reported Order Context
              </h3>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-2 text-xs">
                {report.order && (
                  <div>
                    <span className="text-gray-400">Order Number:</span>
                    <span className="ml-2 font-mono font-bold text-gray-900">#{report.order.orderNumber}</span>
                    <span className="ml-4 text-gray-400">Price:</span>
                    <span className="ml-1 font-semibold text-emerald-600">${report.order.agreedPrice}</span>
                  </div>
                )}
                {report.rental && (
                  <div>
                    <span className="text-gray-400">Rental Order Number:</span>
                    <span className="ml-2 font-mono font-bold text-gray-900">#{report.rental.orderNumber}</span>
                    <span className="ml-4 text-gray-400">Total Amount:</span>
                    <span className="ml-1 font-semibold text-emerald-600">${report.rental.totalAmount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Internal Notes Section */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Internal Moderation Notes
            </h3>
            <p className="text-xs text-gray-500">Internal notes are strictly confidential to moderators and admins.</p>

            <form onSubmit={handleAddInternalNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Add internal note for moderation team..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={noteSubmitting || !newNote.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Save Note
              </button>
            </form>
          </div>

          {/* Report Audit Trail Box */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Report Audit Trail</h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400">No previous moderation actions or notes recorded for this report</p>
            ) : (
              <div className="space-y-2 text-xs">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex flex-col gap-1 rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{log.action}</span>
                      <span className="text-gray-400 text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-600">
                      By Moderator: <span className="font-semibold text-gray-800">{log.actor?.displayName || log.actorId.slice(0, 8)}</span>
                    </div>
                    {log.metadata?.note && (
                      <p className="mt-1 rounded-lg bg-white p-2 text-gray-700 italic border border-gray-100">
                        "{log.metadata.note}"
                      </p>
                    )}
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
              This moderation decision will be executed and recorded in the audit log.
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

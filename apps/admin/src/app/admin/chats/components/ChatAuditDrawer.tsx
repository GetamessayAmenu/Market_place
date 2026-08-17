'use client'

import { XCircle, CheckCircle, AlertCircle, AlertTriangle, Shield, Clock } from 'lucide-react'

interface FlagLog {
  id: string
  reason: string
  keywordTriggered: string | null
  status: string
  createdAt: string
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
  flagLogs: FlagLog[]
}

interface ChatAuditDrawerProps {
  thread: FlaggedThread
  onClose: () => void
  onResolve: (conversationId: string, action: 'DISMISS' | 'WARN_USER' | 'BAN_USER') => void
}

export function ChatAuditDrawer({ thread, onClose, onResolve }: ChatAuditDrawerProps) {
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-3xl">
          <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
            <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Thread Audit</h2>
                  <p className="text-sm text-gray-500 mt-1">Review flagged conversation and take enforcement action</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Thread Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Thread Details</h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                    <div>
                      <dt className="text-gray-500">Thread ID</dt>
                      <dd className="text-gray-900 font-mono text-xs">{thread.id}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Risk Score</dt>
                      <dd>{getRiskBadge(thread.riskScore)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Buyer</dt>
                      <dd className="text-gray-900">{thread.buyer.displayName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Seller</dt>
                      <dd className="text-gray-900">{thread.seller.displayName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Last Activity</dt>
                      <dd className="text-gray-900">{formatDate(thread.lastMessageAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Created</dt>
                      <dd className="text-gray-900">{formatDate(thread.createdAt)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Flag Logs */}
                {thread.flagLogs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Flag History</h3>
                    <div className="space-y-2">
                      {thread.flagLogs.map((log) => (
                        <div key={log.id} className="rounded-md bg-gray-50 p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{log.reason}</span>
                            {getFlagStatusBadge(log.status)}
                          </div>
                          {log.keywordTriggered && (
                            <p className="mt-2 text-xs text-gray-500">
                              Triggered keyword: <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{log.keywordTriggered}</span>
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Link */}
                {thread.listing && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Associated Product</h3>
                    <a
                      href={`/listings/${thread.listing.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      View Product: {thread.listing.title}
                    </a>
                  </div>
                )}

                {/* Admin Action Panel */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Admin Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => onResolve(thread.id, 'DISMISS')}
                      className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Dismiss Flag & Clear Risk
                    </button>
                    <button
                      onClick={() => onResolve(thread.id, 'WARN_USER')}
                      className="w-full rounded-md bg-yellow-600 px-4 py-3 text-sm font-medium text-white hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Issue Official Platform Warning
                    </button>
                    <button
                      onClick={() => onResolve(thread.id, 'BAN_USER')}
                      className="w-full rounded-md bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Ban / Suspend User Account
                    </button>
                  </div>
                </div>

                {/* Audit Trail Helper Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Audit Trail Information</p>
                      <p className="text-blue-700">
                        All enforcement actions are automatically logged in the audit trail with timestamps, admin ID, and action reasons. 
                        Banning users will immediately restrict their platform access and prevent further interactions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

type Message = {
  id: string
  senderId: string
  body: string
  isFlagged: boolean
  createdAt: string
  sender: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
}

type Conversation = {
  id: string
  buyer: { id: string; displayName: string; email: string; avatarUrl: string | null }
  seller: { id: string; displayName: string; email: string; avatarUrl: string | null }
  listing: { id: string; title: string; slug: string } | null
  riskScore: number
  isFlagged: boolean
}

type FlagLog = {
  id: string
  reason: string
  keywordTriggered: string | null
  status: string
  createdAt: string
  flaggedByUser?: {
    id: string
    displayName: string
    email: string
  }
}

interface ChatAuditDrawerProps {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation
  messages: Message[]
  flagLogs: FlagLog[]
  onResolve: (action: 'DISMISS' | 'WARN_USER' | 'BAN_USER', reason: string) => void
}

export function ChatAuditDrawer({
  isOpen,
  onClose,
  conversation,
  messages,
  flagLogs,
  onResolve,
}: ChatAuditDrawerProps) {
  const [selectedAction, setSelectedAction] = useState<'DISMISS' | 'WARN_USER' | 'BAN_USER' | null>(null)
  const [warningText, setWarningText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    if (!selectedAction) return

    setLoading(true)
    try {
      await onResolve(selectedAction, warningText)
      onClose()
    } catch (error) {
      console.error('Failed to resolve flag:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 80) return { label: '🔴 Critical', className: 'bg-red-100 text-red-800' }
    if (riskScore >= 60) return { label: '🟠 High', className: 'bg-orange-100 text-orange-800' }
    if (riskScore >= 30) return { label: '🟡 Medium', className: 'bg-yellow-100 text-yellow-800' }
    return { label: '🟢 Low', className: 'bg-green-100 text-green-800' }
  }

  const highlightFlaggedContent = (text: string) => {
    if (!text) return text
    // Simple highlighting for demonstration - in production, you'd use more sophisticated highlighting
    return text
  }

  if (!isOpen) return null

  const riskBadge = getRiskBadge(conversation.riskScore)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-6xl">
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Chat Audit & Enforcement</h2>
                <p className="text-sm text-gray-500">
                  Thread ID: {conversation.id.slice(0, 8)}... • Risk Score: {conversation.riskScore}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close panel</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Split View Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: Chat Transcript */}
              <div className="flex-1 overflow-y-auto border-r">
                <div className="p-6">
                  {/* Conversation Info */}
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Conversation Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Buyer:</p>
                        <p className="text-gray-600">{conversation.buyer.displayName}</p>
                        <p className="text-gray-400 text-xs">{conversation.buyer.email}</p>
                      </div>
                      <div>
                        <p className="font-medium">Seller:</p>
                        <p className="text-gray-600">{conversation.seller.displayName}</p>
                        <p className="text-gray-400 text-xs">{conversation.seller.email}</p>
                      </div>
                      {conversation.listing && (
                        <div className="col-span-2">
                          <p className="font-medium">Product:</p>
                          <a
                            href={`/listings/${conversation.listing.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {conversation.listing.title}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Message History</h3>
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No messages in this conversation</div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === conversation.buyer.id ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderId === conversation.buyer.id
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'bg-indigo-600 text-white'
                              } ${message.isFlagged ? 'ring-2 ring-red-500' : ''}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  {message.sender.displayName}
                                </span>
                                {message.isFlagged && (
                                  <span className="text-xs bg-red-500 text-white px-1 rounded">⚠️ Flagged</span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {highlightFlaggedContent(message.body)}
                              </p>
                              <span className="text-xs opacity-70 mt-1 block">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Admin Action Panel */}
              <div className="w-96 overflow-y-auto bg-gray-50">
                <div className="p-6">
                  {/* Flag Reason Details */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Flag Details</h3>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${riskBadge.className}`}>
                          {riskBadge.label} Risk
                        </span>
                        <span className="text-xs text-gray-500">
                          {conversation.isFlagged ? 'Currently Flagged' : 'Not Flagged'}
                        </span>
                      </div>
                      
                      {flagLogs.length > 0 ? (
                        <div className="space-y-3">
                          {flagLogs.map((log) => (
                            <div key={log.id} className="border-l-2 border-red-500 pl-3">
                              <p className="text-sm font-medium text-gray-900">{log.reason}</p>
                              {log.keywordTriggered && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Triggered: "{log.keywordTriggered}"
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Status: {log.status} • {new Date(log.createdAt).toLocaleString()}
                              </p>
                              {log.flaggedByUser && (
                                <p className="text-xs text-gray-500">
                                  Flagged by: {log.flaggedByUser.displayName}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No flag logs available</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Admin Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setSelectedAction('DISMISS')}
                        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                          selectedAction === 'DISMISS'
                            ? 'bg-green-700 text-white'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        Dismiss Flag & Clear Risk
                      </button>
                      <button
                        onClick={() => setSelectedAction('WARN_USER')}
                        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                          selectedAction === 'WARN_USER'
                            ? 'bg-yellow-700 text-white'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        Issue Official Platform Warning
                      </button>
                      <button
                        onClick={() => setSelectedAction('BAN_USER')}
                        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                          selectedAction === 'BAN_USER'
                            ? 'bg-red-700 text-white'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Ban / Suspend User Account
                      </button>
                    </div>
                  </div>

                  {/* Warning Text Input */}
                  {selectedAction === 'WARN_USER' && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Warning Message</h3>
                      <textarea
                        value={warningText}
                        onChange={(e) => setWarningText(e.target.value)}
                        placeholder="Enter warning message to send to users..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Confirmation & Submit */}
                  {selectedAction && (
                    <div className="mb-6">
                      <button
                        onClick={handleAction}
                        disabled={loading || (selectedAction === 'WARN_USER' && !warningText.trim())}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Processing...' : `Confirm ${selectedAction.replace('_', ' ')}`}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAction(null)
                          setWarningText('')
                        }}
                        className="w-full mt-2 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Audit Trail Helper */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Audit Trail Info</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• All actions are logged automatically</li>
                      <li>• Flag resolution creates immutable audit records</li>
                      <li>• User bans are immediate and irreversible</li>
                      <li>• Warnings are sent to both participants</li>
                    </ul>
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

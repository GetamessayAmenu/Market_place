'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SellerAnalytics {
  seller: { id: string; displayName: string; email: string }
  conversationsStarted: number
  buyerInquiries: number
  responseRate: number
  avgResponseTimeMinutes: number
  unansweredConversations: number
  reportsReceived: number
  blockRate: number
}

export default function ChatAnalyticsPage() {
  const [sellerId, setSellerId] = useState('')
  const [sellerData, setSellerData] = useState<SellerAnalytics | null>(null)
  const [loadingSeller, setLoadingSeller] = useState(false)

  const handleSearchSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sellerId.trim()) return

    try {
      setLoadingSeller(true)
      const res = await fetch(`/api/v1/admin/chats/sellers/${sellerId}/analytics`)
      if (res.ok) {
        const data = await res.json()
        setSellerData(data)
      } else {
        alert('Seller not found or has no chat history')
      }
    } catch (err) {
      console.error('Failed to load seller analytics:', err)
    } finally {
      setLoadingSeller(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Seller & Listing Chat Analytics</h1>
          <p className="text-sm text-gray-500">Monitor seller responsiveness, buyer inquiry conversion & listing chat engagement</p>
        </div>
        <Link
          href="/admin/chat"
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link href="/admin/chat" className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            Overview
          </Link>
          <Link href="/admin/chat/reports" className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            Reports Queue
          </Link>
          <Link href="/admin/chats" className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            Flagged Threads
          </Link>
          <Link href="/admin/chat/analytics" className="border-b-2 border-indigo-600 px-1 py-4 text-sm font-semibold text-indigo-600">
            Seller & Listing Analytics
          </Link>
        </nav>
      </div>

      {/* Search Seller Section */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Inspect Seller Chat Performance</h3>
        <p className="text-xs text-gray-500">
          Enter a Seller User ID to retrieve response times, inquiry rates, and block metrics.
        </p>

        <form onSubmit={handleSearchSeller} className="flex gap-3 max-w-lg">
          <input
            type="text"
            placeholder="Enter Seller UUID..."
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loadingSeller}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingSeller ? 'Loading...' : 'Inspect Analytics'}
          </button>
        </form>

        {/* Display Seller Analytics Results */}
        {sellerData && (
          <div className="mt-6 border-t border-gray-100 pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{sellerData.seller.displayName}</h4>
                <p className="text-xs text-gray-500">{sellerData.seller.email} (Seller ID: {sellerData.seller.id})</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Seller Response Metrics Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <span className="text-xs font-medium text-gray-500">Conversations Started</span>
                <p className="mt-2 text-2xl font-bold text-gray-900">{sellerData.conversationsStarted}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <span className="text-xs font-medium text-gray-500">Response Rate</span>
                <p className="mt-2 text-2xl font-bold text-indigo-600">{sellerData.responseRate}%</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <span className="text-xs font-medium text-gray-500">Avg Response Time</span>
                <p className="mt-2 text-2xl font-bold text-blue-600">{sellerData.avgResponseTimeMinutes} mins</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <span className="text-xs font-medium text-gray-500">Unanswered Conversations</span>
                <p className="mt-2 text-2xl font-bold text-rose-600">{sellerData.unansweredConversations}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">Reports Received Against Seller</span>
                  <p className="mt-1 text-xl font-bold text-gray-900">{sellerData.reportsReceived}</p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">Audit report count</span>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">Buyer Block Rate</span>
                  <p className="mt-1 text-xl font-bold text-gray-900">{sellerData.blockRate}%</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Peer blocks</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

export default function NotificationsBroadcastsPage() {
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'system' | 'history'>('broadcasts')
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    scheduledFor: '',
  })

  useEffect(() => {
    loadNotifications()
  }, [activeTab])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API calls
      // const response = await getNotifications({ type: activeTab })
      // if (response.success && response.data) {
      //   setNotifications(response.data)
      // }
      setNotifications([])
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBroadcast = async () => {
    try {
      // TODO: Implement broadcast creation
      console.log('Create broadcast:', newBroadcast)
      setShowCreateModal(false)
      setNewBroadcast({ title: '', message: '', targetAudience: 'all', scheduledFor: '' })
    } catch (error) {
      console.error('Failed to create broadcast:', error)
    }
  }

  const handleSendNow = async (id: string) => {
    // TODO: Implement send now logic
    console.log('Send now:', id)
  }

  const handleCancel = async (id: string) => {
    // TODO: Implement cancel logic
    console.log('Cancel:', id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications & Broadcasts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Broadcast
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('broadcasts')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'broadcasts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Platform Broadcasts
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'system'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            System Alerts
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Active Broadcasts</dt>
          <dd className="mt-2 text-3xl font-bold text-blue-600">
            {notifications.filter((n) => n.status === 'scheduled').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Sent Today</dt>
          <dd className="mt-2 text-3xl font-bold text-green-600">
            {notifications.filter((n) => n.status === 'sent').length}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Total Recipients</dt>
          <dd className="mt-2 text-3xl font-bold text-indigo-600">
            {notifications.reduce((sum, n) => sum + (n.recipientCount || 0), 0)}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Open Rate</dt>
          <dd className="mt-2 text-3xl font-bold text-gray-900">
            {notifications.length > 0 ? '78%' : '0%'}
          </dd>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Target Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Scheduled For
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
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
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No notifications found
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {notification.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {notification.targetAudience}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {notification.scheduledFor ? new Date(notification.scheduledFor).toLocaleString() : 'Immediate'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {notification.recipientCount || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {notification.status === 'scheduled' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendNow(notification.id)}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Send Now
                          </button>
                          <button
                            onClick={() => handleCancel(notification.id)}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      <button className="ml-2 text-gray-600 hover:text-gray-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Broadcast Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative rounded-lg bg-white p-6 shadow-xl max-w-lg w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Platform Broadcast</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newBroadcast.title}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Enter broadcast title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={newBroadcast.message}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    rows={4}
                    placeholder="Enter broadcast message"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={newBroadcast.targetAudience}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, targetAudience: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="sellers">Sellers Only</option>
                    <option value="buyers">Buyers Only</option>
                    <option value="verified">Verified Users Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule For (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newBroadcast.scheduledFor}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, scheduledFor: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBroadcast}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Create Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

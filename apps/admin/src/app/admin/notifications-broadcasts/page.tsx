'use client'

import { useEffect, useState } from 'react'
import {
  AdminBroadcast,
  AdminBroadcastStats,
  cancelAdminBroadcast,
  createAdminBroadcast,
  deleteAdminBroadcastDraft,
  fetchAdminBroadcasts,
  fetchAdminBroadcastStats,
  sendAdminBroadcastNow,
  updateAdminBroadcast,
} from '../../../lib/adminApi'

export default function NotificationsBroadcastsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>([])
  const [stats, setStats] = useState<AdminBroadcastStats>({
    activeBroadcasts: 0,
    sentToday: 0,
    totalRecipients: 0,
    readRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [showModal, setShowModal] = useState(false)
  const [editingBroadcast, setEditingBroadcast] = useState<AdminBroadcast | null>(null)
  const [viewingBroadcast, setViewingBroadcast] = useState<AdminBroadcast | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
    actionUrl: '',
    actionLabel: '',
    audience: 'ALL_USERS',
    scheduledAt: '',
  })

  useEffect(() => {
    void loadData()
  }, [statusFilter, page, search])

  const loadData = async () => {
    try {
      setLoading(true)
      const [res, statsRes] = await Promise.all([
        fetchAdminBroadcasts({
          page,
          limit: 10,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: search.trim() || undefined,
        }),
        fetchAdminBroadcastStats().catch(() => null),
      ])

      if (res && res.data) {
        setBroadcasts(res.data)
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1)
        }
      }

      if (statsRes && statsRes.data) {
        setStats(statsRes.data)
      }
    } catch (error) {
      console.error('Failed to load broadcasts:', error)
      showToast('Failed to load broadcasts list.')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleOpenCreate = () => {
    setEditingBroadcast(null)
    setFormData({
      title: '',
      message: '',
      imageUrl: '',
      actionUrl: '',
      actionLabel: '',
      audience: 'ALL_USERS',
      scheduledAt: '',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (b: AdminBroadcast) => {
    setEditingBroadcast(b)
    setFormData({
      title: b.title,
      message: b.message,
      imageUrl: b.imageUrl || '',
      actionUrl: b.actionUrl || '',
      actionLabel: b.actionLabel || '',
      audience: b.audience,
      scheduledAt: b.scheduledAt ? new Date(b.scheduledAt).toISOString().slice(0, 16) : '',
    })
    setShowModal(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('Title and message are required.')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        title: formData.title,
        message: formData.message,
        audience: formData.audience,
      }
      if (formData.imageUrl.trim()) payload.imageUrl = formData.imageUrl.trim()
      if (formData.actionUrl.trim()) payload.actionUrl = formData.actionUrl.trim()
      if (formData.actionLabel.trim()) payload.actionLabel = formData.actionLabel.trim()
      if (formData.scheduledAt.trim()) payload.scheduledAt = new Date(formData.scheduledAt).toISOString()

      if (editingBroadcast) {
        await updateAdminBroadcast(editingBroadcast.id, payload)
        showToast('Broadcast updated successfully.')
      } else {
        await createAdminBroadcast(payload)
        showToast('Broadcast created successfully.')
      }
      setShowModal(false)
      void loadData()
    } catch (err: any) {
      console.error('Submit failed:', err)
      showToast(err.message || 'Failed to save broadcast.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendNow = async (id: string) => {
    if (!confirm('Are you sure you want to send this broadcast immediately to target users?')) return
    try {
      await sendAdminBroadcastNow(id)
      showToast('Broadcast delivery queued successfully.')
      void loadData()
    } catch (err: any) {
      showToast(err.message || 'Failed to send broadcast.')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled broadcast?')) return
    try {
      await cancelAdminBroadcast(id)
      showToast('Scheduled broadcast cancelled.')
      void loadData()
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel broadcast.')
    }
  }

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('Delete this broadcast draft?')) return
    try {
      await deleteAdminBroadcastDraft(id)
      showToast('Broadcast draft deleted.')
      void loadData()
    } catch (err: any) {
      showToast(err.message || 'Failed to delete draft.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800'
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-800 animate-pulse'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Broadcasts</h1>
          <p className="text-sm text-gray-500">Manage platform-wide announcements, scheduled broadcasts, and analytics.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          + Create Broadcast
        </button>
      </div>

      {toastMessage && (
        <div className="rounded-lg bg-indigo-600 p-4 text-white text-sm font-medium shadow-md transition-all">
          {toastMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Scheduled Broadcasts</dt>
          <dd className="mt-2 text-3xl font-bold text-blue-600">{stats.activeBroadcasts}</dd>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Sent Today</dt>
          <dd className="mt-2 text-3xl font-bold text-green-600">{stats.sentToday}</dd>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Total Recipients Reached</dt>
          <dd className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalRecipients.toLocaleString()}</dd>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <dt className="text-sm font-medium text-gray-500">Average Read Rate</dt>
          <dd className="mt-2 text-3xl font-bold text-gray-900">{stats.readRate}%</dd>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'DRAFT', 'SCHEDULED', 'PROCESSING', 'SENT', 'CANCELLED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search broadcasts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Broadcasts Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title & Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Schedule / Sent Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Recipients (Delivered / Read)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading broadcasts...
                  </td>
                </tr>
              ) : broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No broadcasts found for this filter.
                  </td>
                </tr>
              ) : (
                broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-gray-900 truncate">{b.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{b.message}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-gray-600">
                      <span className="rounded bg-gray-100 px-2 py-1">
                        {b.audience === 'ALL_USERS' ? 'All Users' : b.audience === 'BUYERS' ? 'Buyers Only' : 'Sellers Only'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500">
                      {b.sentAt
                        ? `Sent: ${new Date(b.sentAt).toLocaleString()}`
                        : b.scheduledAt
                        ? `Sched: ${new Date(b.scheduledAt).toLocaleString()}`
                        : 'Immediate / Draft'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-600">
                      {b.totalRecipients > 0 ? (
                        <span>
                          {b.deliveredCount} / <strong className="text-indigo-600">{b.totalRecipients}</strong> ({b.readCount} read)
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingBroadcast(b)}
                          className="text-xs font-medium text-gray-600 hover:text-gray-900"
                        >
                          Details
                        </button>

                        {(b.status === 'DRAFT' || b.status === 'SCHEDULED') && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="text-xs font-medium text-indigo-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleSendNow(b.id)}
                              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              Send Now
                            </button>
                          </>
                        )}

                        {b.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="rounded bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700"
                          >
                            Cancel
                          </button>
                        )}

                        {b.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDeleteDraft(b.id)}
                            className="text-xs font-medium text-rose-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingBroadcast ? 'Edit Broadcast' : 'Create Platform Broadcast'}
            </h2>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Meskel Holiday Special Discounts!"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Message Body *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write announcement details..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="ALL_USERS">All Platform Users</option>
                    <option value="BUYERS">Buyers Only</option>
                    <option value="SELLERS">Sellers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Schedule Date/Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Action URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    placeholder="/listings/featured"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Action Label (Optional)</label>
                  <input
                    type="text"
                    value={formData.actionLabel}
                    onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                    placeholder="Explore Offers"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Banner Image URL (Optional)</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingBroadcast ? 'Update Broadcast' : 'Save Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Drawer / Modal */}
      {viewingBroadcast && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewingBroadcast.title}</h3>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(viewingBroadcast.status)}`}>
                  {viewingBroadcast.status}
                </span>
              </div>
              <button
                onClick={() => setViewingBroadcast(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{viewingBroadcast.message}</p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Target Audience:</span>
                <p className="font-semibold text-gray-800">{viewingBroadcast.audience}</p>
              </div>
              <div>
                <span className="text-gray-500">Created By:</span>
                <p className="font-semibold text-gray-800">{viewingBroadcast.createdBy?.displayName || 'Admin'}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Recipients:</span>
                <p className="font-semibold text-gray-800">{viewingBroadcast.totalRecipients}</p>
              </div>
              <div>
                <span className="text-gray-500">Read Count:</span>
                <p className="font-semibold text-indigo-600">{viewingBroadcast.readCount}</p>
              </div>
            </div>

            {viewingBroadcast.actionUrl && (
              <div className="text-xs pt-2">
                <span className="text-gray-500">Action Link:</span>
                <p className="font-mono text-indigo-600 truncate">{viewingBroadcast.actionUrl}</p>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setViewingBroadcast(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

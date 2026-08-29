'use client'
import {
  Button,
  Select,
  Pagination,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Spinner,
  Alert,
  Badge,
} from '@marketplace/ui'
import React, { useState, useCallback, useEffect } from 'react'

import { 
  fetchModerationItems, 
  fetchModerationStats, 
  moderateItem, 
  toggleSpamFlag, 
  bulkModerationAction,
  fetchModerationHistory,
  type ModerationItem,
  type PaginatedResponse 
} from '../../lib/adminApi'

import { StatusBadge, formatDateTime, formatDate } from './StatusBadge'

interface ModerationDashboardProps {
  initialData: PaginatedResponse<ModerationItem>
  initialStats: Record<string, number>
}

export default function ModerationDashboard({ initialData, initialStats }: ModerationDashboardProps) {
  const [items, setItems] = useState(initialData.data)
  const [page, setPage] = useState(initialData.meta.page)
  const [totalPages, setTotalPages] = useState(initialData.meta.totalPages)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState(initialStats)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [spamFilter, setSpamFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')

  // Bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'delete' | 'restore'>('approve')
  const [bulkReason, setBulkReason] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Detail modal & active tabs
  const [detailItem, setDetailItem] = useState<ModerationItem | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')
  const [history, setHistory] = useState<any[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Moderation state
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const fetchData = useCallback(async (p: number, st: string, t: string, q: string, sp: string, sb: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchModerationItems({
        page: p,
        limit: 10,
        status: st || undefined,
        itemType: t || undefined,
        search: q || undefined,
        isSpam: sp || undefined,
        sortBy: sb as any,
      })
      setItems(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load moderation items.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetchModerationStats()
      setStats(res.data)
    } catch {
      // Stats fetch failure is not critical
    }
  }, [])

  const fetchHistory = useCallback(async (itemId: string) => {
    setHistoryLoading(true)
    try {
      const res = await fetchModerationHistory(itemId)
      setHistory(res)
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (detailItem) {
      setActiveTab('details')
      setShowRejectForm(false)
      setRejectReason('')
      setDeleteConfirm(false)
      void fetchHistory(detailItem.id)
    } else {
      setHistory(null)
    }
  }, [detailItem, fetchHistory])

  const handlePageChange = (p: number) => {
    setPage(p)
    setSelected(new Set())
    void fetchData(p, statusFilter, typeFilter, search, spamFilter, sortBy)
  }

  const handleFilter = () => {
    setPage(1)
    setSelected(new Set())
    void fetchData(1, statusFilter, typeFilter, search, spamFilter, sortBy)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((i) => i.id)))
    }
  }

  const handleBulkSubmit = async () => {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      await bulkModerationAction(Array.from(selected), bulkAction, bulkReason)
      setBulkModal(false)
      setBulkReason('')
      setSelected(new Set())
      void fetchData(page, statusFilter, typeFilter, search, spamFilter, sortBy)
      void fetchStats()
    } catch {
      setError('Bulk action failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject' | 'delete' | 'restore' | 'spam') => {
    if (!detailItem) return
    setActionLoading(true)
    setError(null)
    try {
      if (action === 'approve') {
        const updated = await moderateItem(detailItem.id, 'approve')
        setDetailItem(updated.data)
        setItems(prev => prev.map(i => i.id === detailItem.id ? { ...i, status: 'approved' } : i))
      } else if (action === 'reject') {
        if (!rejectReason.trim()) {
          setError('Rejection reason is required.')
          setActionLoading(false)
          return
        }
        const updated = await moderateItem(detailItem.id, 'reject', rejectReason)
        setDetailItem(updated.data)
        setShowRejectForm(false)
        setRejectReason('')
        setItems(prev => prev.map(i => i.id === detailItem.id ? { ...i, status: 'rejected' } : i))
      } else if (action === 'delete') {
        await moderateItem(detailItem.id, 'delete')
        setDetailItem(null)
        setDeleteConfirm(false)
        setItems(prev => prev.filter(i => i.id !== detailItem.id))
      } else if (action === 'restore') {
        const updated = await moderateItem(detailItem.id, 'restore')
        setDetailItem(updated.data)
        setItems(prev => prev.map(i => i.id === detailItem.id ? { ...i, status: 'approved' } : i))
      } else if (action === 'spam') {
        const updated = await toggleSpamFlag(detailItem.id, !detailItem.isSpam)
        setDetailItem(updated.data)
        setItems(prev => prev.map(i => i.id === detailItem.id ? { ...i, isSpam: !detailItem.isSpam } : i))
      }
      void fetchHistory(detailItem.id)
      void fetchData(page, statusFilter, typeFilter, search, spamFilter, sortBy)
      void fetchStats()
    } catch {
      setError(`Failed to perform action: ${action}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-warning">{stats.pending || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-success">{stats.approved || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-destructive">{stats.rejected || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Under Review</p>
          <p className="text-2xl font-bold text-info">{stats.underReview || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Spam</p>
          <p className="text-2xl font-bold text-purple-600">{stats.spam || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
          <Select
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'Under Review', value: 'under_review' },
              { label: 'Deleted', value: 'deleted' },
            ]}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Type</label>
          <Select
            options={[
              { label: 'All Types', value: '' },
              { label: 'Review', value: 'review' },
              { label: 'Product Image', value: 'product_image' },
              { label: 'Store Logo', value: 'store_logo' },
              { label: 'Store Banner', value: 'store_banner' },
              { label: 'Store Gallery', value: 'store_gallery' },
              { label: 'Custom Service Description', value: 'custom_service_description' },
              { label: 'Custom Service Reference', value: 'custom_service_reference' },
            ]}
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setTypeFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Spam</label>
          <Select
            options={[
              { label: 'All', value: '' },
              { label: 'Spam Only', value: 'true' },
              { label: 'Not Spam', value: 'false' },
            ]}
            value={spamFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSpamFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Sort By</label>
          <Select
            options={[
              { label: 'Created Date', value: 'createdAt' },
              { label: 'Report Count', value: 'reportCount' },
              { label: 'Spam Score', value: 'spamScore' },
            ]}
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSortBy(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Search</label>
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value) }}
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Apply Filters</Button>
        {selected.size > 0 && (
          <Button size="sm" variant="outline" onClick={() => { setBulkAction('approve'); setBulkModal(true) }}>
            Bulk Action ({String(selected.size)})
          </Button>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {loading && <div className="flex justify-center p-8"><Spinner /></div>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input"
                />
              </TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Spam</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No moderation items found.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => { toggleSelect(item.id) }}
                    className="h-4 w-4 rounded border-input"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                    ) : item.review ? (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                        {item.review.rating}★
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">No img</div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-[200px]" title={item.content || item.review?.title || 'N/A'}>
                        {item.content || item.review?.title || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {item.review?.listing?.title || 'No related listing'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm capitalize">{item.itemType.replace(/_/g, ' ')}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} domain="verification" />
                </TableCell>
                <TableCell className="text-sm">{item.reportCount}</TableCell>
                <TableCell>
                  {item.isSpam && (
                    <Badge variant="error" className="text-[10px]">Spam</Badge>
                  )}
                  {item.spamScore && item.spamScore > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">({item.spamScore})</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(item.createdAt)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => { setDetailItem(item) }}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total items</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Bulk Action Modal */}
      <Modal open={bulkModal} onClose={() => { setBulkModal(false) }} title="Bulk Action" size="sm">
        <div className="space-y-4">
          <Select
            label="Action"
            options={[
              { label: 'Approve', value: 'approve' },
              { label: 'Reject', value: 'reject' },
              { label: 'Delete', value: 'delete' },
              { label: 'Restore', value: 'restore' },
            ]}
            value={bulkAction}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setBulkAction(e.target.value as 'approve' | 'reject' | 'delete' | 'restore') }}
          />
          <textarea
            placeholder="Reason (optional)"
            value={bulkReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setBulkReason(e.target.value) }}
            className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setBulkModal(false) }}>Cancel</Button>
            <Button onClick={() => { void handleBulkSubmit() }} disabled={bulkLoading}>
              {bulkLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailItem !== null} onClose={() => { setDetailItem(null) }} title="Content Moderation" size="lg">
        {detailItem && (
          <div className="space-y-6">
            {/* Content preview */}
            <div className="flex flex-col md:flex-row gap-6">
              {detailItem.imageUrl ? (
                <img src={detailItem.imageUrl} alt="" className="h-40 w-40 rounded-lg object-cover bg-muted border flex-shrink-0" />
              ) : (
                <div className="h-40 w-40 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground border flex-shrink-0">
                  {detailItem.review?.rating ? `${detailItem.review.rating}★` : 'No image'}
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-xl truncate max-w-full">
                    {detailItem.review?.title || detailItem.content || 'Content Item'}
                  </h3>
                  <StatusBadge status={detailItem.status} domain="verification" />
                  {detailItem.isSpam && (
                    <Badge variant="error" className="text-[10px]">Spam</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  Type: <strong className="text-foreground">{detailItem.itemType.replace(/_/g, ' ')}</strong>
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                  <span>Created: {formatDateTime(detailItem.createdAt)}</span>
                  <span>&middot;</span>
                  <span>Reports: <strong className="text-foreground">{detailItem.reportCount}</strong></span>
                  {detailItem.spamScore && (
                    <>
                      <span>&middot;</span>
                      <span>Spam Score: <strong className="text-foreground">{detailItem.spamScore}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-all -mb-px ${
                  activeTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Content Details
              </button>
              <button
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-all -mb-px ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('history')}
              >
                Moderation History
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'details' ? (
              <div className="space-y-5">
                {/* Content */}
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">Content</h4>
                  <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {detailItem.content || detailItem.review?.body || detailItem.review?.title || 'No content available.'}
                  </p>
                </div>

                {/* Review details if applicable */}
                {detailItem.review && (
                  <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                    <h4 className="font-semibold text-sm text-foreground">Review Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs block">Rating</span>
                        <span className="font-medium text-foreground">{detailItem.review.rating} / 5</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Verified Purchase</span>
                        <span className="font-medium text-foreground">{detailItem.review.verifiedPurchase ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Reviewer</span>
                        <span className="font-medium text-foreground">{detailItem.review.reviewer?.displayName || detailItem.review.reviewer?.email || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Seller</span>
                        <span className="font-medium text-foreground">{detailItem.review.seller?.displayName || detailItem.review.seller?.email || '-'}</span>
                      </div>
                    </div>
                    {detailItem.review.listing && (
                      <div className="pt-2 border-t border-muted-foreground/10">
                        <span className="text-muted-foreground text-xs block">Related Listing</span>
                        <span className="font-medium text-foreground">{detailItem.review.listing.title}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection reason, if applicable */}
                {detailItem.status === 'rejected' && detailItem.rejectionReason && (
                  <div className="border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 rounded-lg p-3 text-sm">
                    <span className="font-semibold text-red-600 dark:text-red-400 block mb-0.5">Rejection Reason:</span>
                    <p className="text-foreground">{detailItem.rejectionReason}</p>
                  </div>
                )}

                {/* Reports */}
                {detailItem.reports && detailItem.reports.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2">Reports ({detailItem.reports.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {detailItem.reports.map((report) => (
                        <div key={report.id} className="border rounded-lg p-3 text-sm bg-muted/5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary">{report.reason}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</span>
                          </div>
                          {report.description && (
                            <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Reported by: <strong className="text-foreground">{report.reporter?.displayName || report.reporter?.email || 'Anonymous'}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {historyLoading ? (
                  <div className="flex justify-center p-8"><Spinner /></div>
                ) : !history || history.length === 0 ? (
                  <div className="border border-dashed rounded-xl p-8 text-center bg-muted/5 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                      📋
                    </div>
                    <p className="text-sm font-medium text-foreground">No moderation history recorded for this item.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-5 py-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                    {history.map((log: any, idx: number) => {
                      const actionStr = (log.action || '').toLowerCase()
                      let badgeVariant: 'success' | 'error' | 'warning' | 'info' | 'secondary' = 'secondary'
                      let iconBg = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      let actionLabel = log.action ? log.action.replace(/^(moderation|review)\./, '').replace(/_/g, ' ').toUpperCase() : 'ACTION'

                      if (actionStr.includes('approved')) {
                        badgeVariant = 'success'
                        iconBg = 'bg-emerald-500 text-white'
                      } else if (actionStr.includes('rejected')) {
                        badgeVariant = 'error'
                        iconBg = 'bg-red-500 text-white'
                      } else if (actionStr.includes('spam')) {
                        badgeVariant = 'error'
                        iconBg = 'bg-purple-500 text-white'
                      } else if (actionStr.includes('delete')) {
                        badgeVariant = 'error'
                        iconBg = 'bg-destructive text-white'
                      } else if (actionStr.includes('restore')) {
                        badgeVariant = 'info'
                        iconBg = 'bg-blue-500 text-white'
                      }

                      const actorName = log.actor?.displayName || log.actor?.email || 'System'

                      return (
                        <div key={log.id || idx} className="relative flex items-start gap-4">
                          <div className={`absolute -left-6 top-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${iconBg}`}>
                            {actionStr.includes('approved') ? '✓' : actionStr.includes('rejected') ? '✕' : actionStr.includes('spam') ? '!' : '•'}
                          </div>

                          <div className="flex-1 border rounded-xl p-3.5 bg-card space-y-2 shadow-sm text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={badgeVariant} className="text-[10px] uppercase font-semibold">
                                  {actionLabel}
                                </Badge>
                                <span className="text-xs font-semibold text-foreground">
                                  {actorName}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(log.createdAt)}
                              </span>
                            </div>

                            {log.metadata?.reason && (
                              <div className="p-2.5 rounded bg-muted/40 border text-xs text-foreground space-y-0.5">
                                <span className="font-semibold text-muted-foreground block text-[10px]">
                                  Reason / Note:
                                </span>
                                <p className="whitespace-pre-wrap">{String(log.metadata.reason)}</p>
                              </div>
                            )}

                            {log.ipAddress && (
                              <div className="text-[10px] text-muted-foreground pt-1 border-t flex justify-between">
                                <span>IP: {log.ipAddress}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Moderation Controls footer */}
            <div className="pt-4 border-t">
              {showRejectForm ? (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 space-y-3">
                  <label className="block text-sm font-semibold text-red-600 dark:text-red-400">Enter Rejection Reason</label>
                  <textarea
                    placeholder="Provide a detailed reason explaining why this content is being rejected..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setShowRejectForm(false); setRejectReason('') }}>Cancel</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAction('reject')} disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                    </Button>
                  </div>
                </div>
              ) : deleteConfirm ? (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 space-y-3">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Are you sure you want to delete this content? This action will soft-delete it.</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAction('delete')} disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : 'Yes, Delete'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-2">
                    {detailItem.status !== 'approved' && (
                      <Button onClick={() => handleAction('approve')} disabled={actionLoading} size="sm">
                        Approve
                      </Button>
                    )}
                    {detailItem.status !== 'rejected' && (
                      <Button variant="outline" onClick={() => setShowRejectForm(true)} disabled={actionLoading} size="sm">
                        Reject
                      </Button>
                    )}
                    {detailItem.status === 'deleted' && (
                      <Button variant="outline" onClick={() => handleAction('restore')} disabled={actionLoading} size="sm">
                        Restore
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleAction('spam')} disabled={actionLoading} size="sm">
                      {detailItem.isSpam ? 'Unmark Spam' : 'Mark as Spam'}
                    </Button>
                    <Button variant="outline" onClick={() => setDeleteConfirm(true)} disabled={actionLoading} size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

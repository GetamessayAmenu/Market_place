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

import { clientGet, clientPost, clientPatch, clientDelete, buildQuery } from '../../lib/clientApi'

import { StatusBadge, formatCurrency, formatDate, formatDateTime } from './StatusBadge'

interface AdminListing {
  id: string
  title: string
  slug: string
  description: string
  price: number
  currency: string
  condition: string
  status: string
  city?: string | null
  state?: string | null
  country?: string | null
  isFeatured: boolean
  availableForPurchase: boolean
  availableForRent: boolean
  customOrderAvailable: boolean
  rentalPricePerDay?: number | null
  rentalDeposit?: number | null
  rentalPricingTier?: string | null
  rentalThreeDayRate?: number | null
  rentalWeeklyRate?: number | null
  cleaningPolicy?: string | null
  fabricCareTags?: string[]
  minRentalDurationDays?: number
  maxRentalDurationDays?: number | null
  supportsReadyMade?: boolean
  supportsCustomDesign?: boolean
  startingCustomPrice?: number | null
  estimatedProductionDays?: number | null
  customizationOptions?: any
  rejectedReason?: string | null
  primaryImageUrl?: string | null
  images?: { url: string; isPrimary: boolean; cloudinaryPublicId?: string; id?: string }[]
  seller?: {
    id: string
    displayName?: string
    email?: string
    phone?: string | null
    location?: string | null
    emailVerifiedAt?: string | null
    phoneVerifiedAt?: string | null
  } | null
  category?: { id: string; name: string; slug: string } | null
  _count?: { favorites: number }
  createdAt: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface ListingsTableProps {
  initialData: PaginatedResponse<AdminListing>
}

export default function ListingsTable({ initialData }: ListingsTableProps) {
  const [listings, setListings] = useState(initialData.data)
  const [page, setPage] = useState(initialData.meta.page)
  const [totalPages, setTotalPages] = useState(initialData.meta.totalPages)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending_review')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  // Status counts for badges
  const [statusCounts, setStatusCounts] = useState<{ pending: number; approved: number; rejected: number }>({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  // Bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'archive'>('approve')
  const [bulkReason, setBulkReason] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Detail modal & active tabs
  const [detailListing, setDetailListing] = useState<AdminListing | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')
  const [history, setHistory] = useState<any[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Moderation state
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const fetchData = useCallback(async (p: number, st: string, t: string, q: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<AdminListing>>(
        '/admin/listings' + buildQuery({
          page: p,
          limit: 10,
          status: st || undefined,
          type: t || undefined,
          search: q || undefined
        })
      )
      setListings(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load listings.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStatusCounts = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        clientGet<PaginatedResponse<AdminListing>>('/admin/listings' + buildQuery({ status: 'pending_review', limit: 1 })),
        clientGet<PaginatedResponse<AdminListing>>('/admin/listings' + buildQuery({ status: 'active', limit: 1 })),
        clientGet<PaginatedResponse<AdminListing>>('/admin/listings' + buildQuery({ status: 'rejected', limit: 1 })),
      ])
      setStatusCounts({
        pending: pendingRes.meta.total,
        approved: approvedRes.meta.total,
        rejected: rejectedRes.meta.total,
      })
    } catch {
      // Silently fail for counts
    }
  }, [])

  const fetchHistory = useCallback(async (listingId: string) => {
    setHistoryLoading(true)
    try {
      const res = await clientGet<any[]>(`/admin/listings/${listingId}/history`)
      setHistory(res)
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (detailListing) {
      setActiveTab('details')
      setShowRejectForm(false)
      setRejectReason('')
      setDeleteConfirm(false)
      void fetchHistory(detailListing.id)
    } else {
      setHistory(null)
    }
  }, [detailListing, fetchHistory])

  useEffect(() => {
    void fetchStatusCounts()
  }, [fetchStatusCounts])

  const handlePageChange = (p: number) => {
    setPage(p)
    setSelected(new Set())
    void fetchData(p, statusFilter, typeFilter, search)
  }

  const handleFilter = () => {
    setPage(1)
    setSelected(new Set())
    void fetchData(1, statusFilter, typeFilter, search)
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
    if (selected.size === listings.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(listings.map((l) => l.id)))
    }
  }

  const handleBulkSubmit = async () => {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      await clientPost('/admin/listings/bulk-action', {
        listingIds: Array.from(selected),
        action: bulkAction,
        ...(bulkReason ? { reason: bulkReason } : {}),
      })
      setBulkModal(false)
      setBulkReason('')
      setSelected(new Set())
      void fetchData(page, statusFilter, typeFilter, search)
    } catch {
      setError('Bulk action failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleAction = async (action: 'approve' | 'hide' | 'delete' | 'feature' | 'reject' | 'request_changes') => {
    if (!detailListing) return
    setActionLoading(true)
    setError(null)
    try {
      if (action === 'approve') {
        const updated = await clientPost<any>(`/admin/listings/${detailListing.id}/approve`)
        setDetailListing(updated)
        setListings(prev => prev.map(l => l.id === detailListing.id ? { ...l, status: 'active' } : l))
      } else if (action === 'hide') {
        const updated = await clientPost<any>(`/admin/listings/${detailListing.id}/hide`)
        setDetailListing(updated)
        setListings(prev => prev.map(l => l.id === detailListing.id ? { ...l, status: 'archived' } : l))
      } else if (action === 'delete') {
        await clientDelete(`/admin/listings/${detailListing.id}`)
        setDetailListing(null)
        setDeleteConfirm(false)
        setListings(prev => prev.filter(l => l.id !== detailListing.id))
      } else if (action === 'feature') {
        const updated = await clientPatch<any>(`/admin/listings/${detailListing.id}/feature`, {
          featured: !detailListing.isFeatured
        })
        setDetailListing(updated)
        setListings(prev => prev.map(l => l.id === detailListing.id ? { ...l, isFeatured: updated.isFeatured } : l))
      } else if (action === 'reject') {
        if (!rejectReason.trim()) {
          setError('Rejection reason is required.')
          setActionLoading(false)
          return
        }
        const updated = await clientPost<any>(`/admin/listings/${detailListing.id}/reject`, {
          reason: rejectReason
        })
        setDetailListing(updated)
        setShowRejectForm(false)
        setRejectReason('')
        setListings(prev => prev.map(l => l.id === detailListing.id ? { ...l, status: 'rejected' } : l))
      } else if (action === 'request_changes') {
        if (!rejectReason.trim()) {
          setError('Feedback reason is required.')
          setActionLoading(false)
          return
        }
        const updated = await clientPost<any>(`/admin/listings/${detailListing.id}/request-changes`, {
          reason: rejectReason
        })
        setDetailListing(updated)
        setShowChangesForm(false)
        setRejectReason('')
        setListings(prev => prev.map(l => l.id === detailListing.id ? { ...l, status: 'pending_review' } : l))
      }
      void fetchHistory(detailListing.id)
      void fetchData(page, statusFilter, typeFilter, search)
      void fetchStatusCounts()
    } catch {
      setError(`Failed to perform action: ${action}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs with Badge Counters */}
      <div className="flex flex-wrap items-center gap-2 border-b">
        <button
          onClick={() => { setStatusFilter('pending_review'); setPage(1); void fetchData(1, 'pending_review', typeFilter, search) }}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
            statusFilter === 'pending_review'
              ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🟡 Pending Review
          {statusCounts.pending > 0 && (
            <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {statusCounts.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => { setStatusFilter('active'); setPage(1); void fetchData(1, 'active', typeFilter, search) }}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
            statusFilter === 'active'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🟢 Approved Listings
          {statusCounts.approved > 0 && (
            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {statusCounts.approved}
            </span>
          )}
        </button>
        <button
          onClick={() => { setStatusFilter('rejected'); setPage(1); void fetchData(1, 'rejected', typeFilter, search) }}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
            statusFilter === 'rejected'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          🔴 Rejected / Changes Requested
          {statusCounts.rejected > 0 && (
            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {statusCounts.rejected}
            </span>
          )}
        </button>
      </div>

      {/* Additional Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Type</label>
          <Select
            options={[
              { label: 'All Types', value: '' },
              { label: 'Products', value: 'buy' },
              { label: 'Rentals', value: 'rent' },
              { label: 'Custom Services', value: 'custom' },
            ]}
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setTypeFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by Product Title, Seller Business Name..."
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
                  checked={listings.length > 0 && selected.size === listings.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input"
                />
              </TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && listings.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No listings found.
                </TableCell>
              </TableRow>
            )}
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(listing.id)}
                    onChange={() => { toggleSelect(listing.id) }}
                    className="h-4 w-4 rounded border-input"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {listing.primaryImageUrl ? (
                      <img src={listing.primaryImageUrl} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">No img</div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-[200px]" title={listing.title}>{listing.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{listing.category?.name ?? 'Uncategorized'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {listing.availableForPurchase && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200/50">
                        Product
                      </span>
                    )}
                    {listing.availableForRent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200/50">
                        Rental
                      </span>
                    )}
                    {listing.customOrderAvailable && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200/50">
                        Custom
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm truncate max-w-[150px]" title={listing.seller?.displayName ?? listing.seller?.email ?? ''}>
                    {listing.seller?.displayName ?? listing.seller?.email ?? '-'}
                  </p>
                </TableCell>
                <TableCell className="text-sm font-medium whitespace-nowrap">{formatCurrency(listing.price, listing.currency)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={listing.status} domain="listing" />
                    {listing.isFeatured && (
                      <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px] px-1 py-0 font-bold uppercase tracking-wider">
                        Featured
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize">{listing.condition}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(listing.createdAt)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => { setDetailListing(listing) }}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total listings</p>
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
              { label: 'Archive', value: 'archive' },
            ]}
            value={bulkAction}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setBulkAction(e.target.value as 'approve' | 'reject' | 'archive') }}
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

      {/* Detail Modal - Split View */}
      <Modal open={detailListing !== null} onClose={() => { setDetailListing(null) }} title="" size="full" className="max-w-6xl">
        {detailListing && (
          <div className="flex flex-col lg:flex-row h-[85vh]">
            {/* LEFT SIDE - Product Details Review */}
            <div className="flex-1 overflow-y-auto border-r p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{detailListing.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={detailListing.status} domain="listing" />
                    {detailListing.isFeatured && (
                      <Badge className="bg-amber-500 text-white font-bold text-[10px] uppercase">Featured</Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === 'details' ? 'history' : 'details')}>
                  {activeTab === 'details' ? 'View History' : 'View Details'}
                </Button>
              </div>

              {/* Image Carousel */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Product Images</h3>
                {detailListing.images && detailListing.images.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {detailListing.images.map((img, idx) => (
                      <img
                        key={img.id || idx}
                        src={img.url}
                        alt={`Product image ${idx + 1}`}
                        className="h-48 w-48 rounded-lg object-cover bg-muted border flex-shrink-0"
                      />
                    ))}
                  </div>
                ) : detailListing.primaryImageUrl ? (
                  <img src={detailListing.primaryImageUrl} alt="" className="h-48 w-48 rounded-lg object-cover bg-muted border" />
                ) : (
                  <div className="h-48 w-48 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground border">
                    No images
                  </div>
                )}
              </div>

              {activeTab === 'details' ? (
                <>
                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">Description</h3>
                    <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border whitespace-pre-wrap">
                      {detailListing.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Pricing Terms */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">Pricing Terms</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg border bg-muted/10">
                        <span className="text-xs text-muted-foreground block mb-1">Base Price</span>
                        <span className="text-xl font-bold text-foreground">{formatCurrency(detailListing.price, detailListing.currency)}</span>
                      </div>
                      {detailListing.availableForRent && (
                        <div className="p-4 rounded-lg border bg-muted/10">
                          <span className="text-xs text-muted-foreground block mb-1">Rental Price</span>
                          <span className="text-xl font-bold text-foreground">{formatCurrency(detailListing.rentalPricePerDay || 0, detailListing.currency)} / day</span>
                        </div>
                      )}
                      {detailListing.rentalDeposit && (
                        <div className="p-4 rounded-lg border bg-muted/10">
                          <span className="text-xs text-muted-foreground block mb-1">Rental Deposit</span>
                          <span className="text-xl font-bold text-foreground">{formatCurrency(detailListing.rentalDeposit, detailListing.currency)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rental Deposit Rules */}
                  {detailListing.availableForRent && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-foreground">Rental Deposit Rules</h3>
                      <div className="p-4 rounded-lg border bg-muted/10 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Duration:</span>
                          <span className="font-medium">{detailListing.minRentalDurationDays} day(s)</span>
                        </div>
                        {detailListing.maxRentalDurationDays && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max Duration:</span>
                            <span className="font-medium">{detailListing.maxRentalDurationDays} day(s)</span>
                          </div>
                        )}
                        {detailListing.cleaningPolicy && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cleaning Policy:</span>
                            <span className="font-medium capitalize">{detailListing.cleaningPolicy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Tailoring Lead Times */}
                  {detailListing.customOrderAvailable && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-foreground">Custom Tailoring Details</h3>
                      <div className="p-4 rounded-lg border bg-muted/10 space-y-2 text-sm">
                        {detailListing.estimatedProductionDays && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Production Time:</span>
                            <span className="font-medium">{detailListing.estimatedProductionDays} days</span>
                          </div>
                        )}
                        {detailListing.startingCustomPrice && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Starting Price:</span>
                            <span className="font-medium">{formatCurrency(detailListing.startingCustomPrice, detailListing.currency)}</span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Badge variant={detailListing.supportsReadyMade ? 'success' : 'secondary'} className="text-xs">
                            Ready Made: {detailListing.supportsReadyMade ? 'Yes' : 'No'}
                          </Badge>
                          <Badge variant={detailListing.supportsCustomDesign ? 'success' : 'secondary'} className="text-xs">
                            Custom Design: {detailListing.supportsCustomDesign ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Local Taxonomy Tags */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">Category & Tags</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Category:</span>
                        <Badge variant="outline">{detailListing.category?.name || 'Uncategorized'}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Condition:</span>
                        <Badge variant="outline" className="capitalize">{detailListing.condition}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm font-medium">{detailListing.city || 'Not specified'}, {detailListing.country || 'ET'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seller Verification Badge */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">Seller Information</h3>
                    <div className="p-4 rounded-lg border bg-muted/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{detailListing.seller?.displayName || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{detailListing.seller?.email || ''}</p>
                        </div>
                        <div className="flex gap-1">
                          {detailListing.seller?.emailVerifiedAt && (
                            <Badge variant="success" className="text-[10px]">✓ Email Verified</Badge>
                          )}
                          {detailListing.seller?.phoneVerifiedAt && (
                            <Badge variant="success" className="text-[10px]">✓ Phone Verified</Badge>
                          )}
                        </div>
                      </div>
                      {detailListing.seller?.location && (
                        <p className="text-xs text-muted-foreground">📍 {detailListing.seller.location}</p>
                      )}
                    </div>
                  </div>

                  {/* Rejected Reason Display */}
                  {detailListing.status === 'rejected' && detailListing.rejectedReason && (
                    <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-destructive mb-2">Previous Rejection Reason</h3>
                      <p className="text-sm text-foreground">{detailListing.rejectedReason}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">Moderation History</h3>
                  {historyLoading ? (
                    <div className="flex justify-center p-8"><Spinner /></div>
                  ) : !history || history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">No moderation history recorded.</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {history.map((log: any) => (
                        <div key={log.id} className="border rounded-lg p-4 text-sm bg-muted/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary capitalize">{log.action.replace('listing.', '').replace(/_/g, ' ')}</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Moderator: <strong className="text-foreground">{log.actor?.displayName || log.actor?.email || 'System'}</strong>
                          </div>
                          {log.metadata?.reason && (
                            <div className="mt-2 bg-muted/40 p-3 rounded text-xs border border-muted-foreground/10 text-foreground">
                              <span className="font-semibold text-muted-foreground block mb-1">Reason:</span>
                              {String(log.metadata.reason)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDE - Action Form */}
            <div className="w-full lg:w-96 p-6 bg-muted/30 border-l space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Moderation Actions</h3>
                <p className="text-sm text-muted-foreground">Review and take action on this listing</p>
              </div>

              {/* Quick Status Info */}
              <div className="p-4 rounded-lg bg-background border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <StatusBadge status={detailListing.status} domain="listing" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm font-medium">{formatDate(detailListing.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="text-sm font-medium">{formatCurrency(detailListing.price, detailListing.currency)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {showRejectForm ? (
                  <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-3">
                    <label className="block text-sm font-semibold text-destructive">Rejection Reason (Required)</label>
                    <textarea
                      placeholder="Provide a detailed reason explaining why this listing is being rejected..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-destructive"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowRejectForm(false); setRejectReason('') }} className="flex-1">
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleAction('reject')} disabled={actionLoading || !rejectReason.trim()} className="flex-1">
                        {actionLoading ? 'Processing...' : 'Confirm Reject'}
                      </Button>
                    </div>
                  </div>
                ) : showChangesForm ? (
                  <div className="border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/10 space-y-3">
                    <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300">Request Changes - Feedback (Required)</label>
                    <textarea
                      placeholder="Describe the changes needed before approval (e.g., better photos, more details, pricing adjustments)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowChangesForm(false); setRejectReason('') }} className="flex-1">
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleAction('request_changes')} disabled={actionLoading || !rejectReason.trim()} className="flex-1">
                        {actionLoading ? 'Processing...' : 'Request Changes'}
                      </Button>
                    </div>
                  </div>
                ) : deleteConfirm ? (
                  <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-3">
                    <p className="text-sm font-semibold text-destructive">Are you sure you want to delete this listing?</p>
                    <p className="text-xs text-muted-foreground">This action will archive and soft-delete the listing.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleAction('delete')} disabled={actionLoading} className="flex-1">
                        {actionLoading ? 'Processing...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleAction('approve')}
                      disabled={actionLoading || detailListing.status === 'active'}
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      ✓ Approve Listing
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowChangesForm(true)}
                      disabled={actionLoading || detailListing.status === 'rejected' || detailListing.status === 'active'}
                      size="lg"
                      className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                    >
                      ⚠ Request Changes
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading || detailListing.status === 'rejected'}
                      size="lg"
                      className="w-full"
                    >
                      ✕ Reject Listing
                    </Button>
                    <div className="border-t pt-2 space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => handleAction('hide')}
                        disabled={actionLoading || detailListing.status === 'archived'}
                        size="sm"
                        className="w-full"
                      >
                        Hide / Archive
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAction('feature')}
                        disabled={actionLoading}
                        size="sm"
                        className="w-full"
                      >
                        {detailListing.isFeatured ? 'Unfeature' : 'Feature'} Listing
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteConfirm(true)}
                        disabled={actionLoading}
                        size="sm"
                        className="w-full"
                      >
                        Delete Permanently
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="error">{error}</Alert>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

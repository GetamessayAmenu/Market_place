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
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

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

  const handleAction = async (action: 'approve' | 'hide' | 'delete' | 'feature' | 'reject') => {
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
      }
      void fetchHistory(detailListing.id)
      void fetchData(page, statusFilter, typeFilter, search)
    } catch {
      setError(`Failed to perform action: ${action}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
          <Select
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Draft', value: 'draft' },
              { label: 'Pending Review', value: 'pending_review' },
              { label: 'Active', value: 'active' },
              { label: 'Sold', value: 'sold' },
              { label: 'Expired', value: 'expired' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'Archived', value: 'archived' },
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
            placeholder="Search listings..."
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

      {/* Detail Modal */}
      <Modal open={detailListing !== null} onClose={() => { setDetailListing(null) }} title="Listing Moderation" size="lg">
        {detailListing && (
          <div className="space-y-6">
            {/* Listing basic details */}
            <div className="flex flex-col md:flex-row gap-6">
              {detailListing.primaryImageUrl ? (
                <img src={detailListing.primaryImageUrl} alt="" className="h-40 w-40 rounded-lg object-cover bg-muted border flex-shrink-0" />
              ) : (
                <div className="h-40 w-40 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground border flex-shrink-0">No image</div>
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-xl truncate max-w-full" title={detailListing.title}>{detailListing.title}</h3>
                  {detailListing.isFeatured && (
                    <Badge className="bg-amber-500 text-white font-bold text-[10px] uppercase">Featured</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={detailListing.status} domain="listing" />
                  <span className="text-xs text-muted-foreground">&middot;</span>
                  <span className="text-sm font-medium text-muted-foreground">{detailListing.category?.name ?? 'N/A'}</span>
                </div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(detailListing.price, detailListing.currency)}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                  <span>Created: {formatDateTime(detailListing.createdAt)}</span>
                  <span>&middot;</span>
                  <span>Condition: <strong className="capitalize text-foreground">{detailListing.condition}</strong></span>
                  {detailListing.city && (
                    <>
                      <span>&middot;</span>
                      <span>City: <strong className="text-foreground">{detailListing.city}</strong></span>
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
                Detailed Information
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
                {/* Description */}
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {detailListing.description || 'No description provided.'}
                  </p>
                </div>

                {/* Listing Type pricing options */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">Type & Pricing Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-lg border bg-muted/10 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="font-medium block text-xs text-muted-foreground mb-1">Product (Buy)</span>
                        <Badge variant={detailListing.availableForPurchase ? 'success' : 'secondary'}>
                          {detailListing.availableForPurchase ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      {detailListing.availableForPurchase && (
                        <span className="text-lg font-bold block text-foreground">{formatCurrency(detailListing.price, detailListing.currency)}</span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-lg border bg-muted/10 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="font-medium block text-xs text-muted-foreground mb-1">Rental (Rent)</span>
                        <Badge variant={detailListing.availableForRent ? 'success' : 'secondary'}>
                          {detailListing.availableForRent ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      {detailListing.availableForRent && (
                        <div className="text-xs space-y-0.5">
                          <span className="font-bold text-foreground block">{formatCurrency(detailListing.rentalPricePerDay || 0, detailListing.currency)} / day</span>
                          <span className="text-muted-foreground block">Deposit: {formatCurrency(detailListing.rentalDeposit || 0, detailListing.currency)}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-lg border bg-muted/10 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="font-medium block text-xs text-muted-foreground mb-1">Custom Orders</span>
                        <Badge variant={detailListing.customOrderAvailable ? 'success' : 'secondary'}>
                          {detailListing.customOrderAvailable ? 'Supported' : 'Unsupported'}
                        </Badge>
                      </div>
                      {detailListing.customOrderAvailable && (
                        <span className="text-xs text-muted-foreground block">Accepts custom order customizations.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seller information card */}
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">Seller Profile Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block">Display Name</span>
                      <span className="font-medium text-foreground">{detailListing.seller?.displayName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Email Address</span>
                      <span className="font-medium text-foreground">{detailListing.seller?.email || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Contact Phone</span>
                      <span className="font-medium text-foreground">{detailListing.seller?.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Seller Location</span>
                      <span className="font-medium text-foreground">{detailListing.seller?.location || '-'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-muted-foreground/10">
                    <Badge variant={detailListing.seller?.emailVerifiedAt ? 'success' : 'secondary'} className="text-[10px]">
                      {detailListing.seller?.emailVerifiedAt ? 'Email Verified' : 'Email Unverified'}
                    </Badge>
                    <Badge variant={detailListing.seller?.phoneVerifiedAt ? 'success' : 'secondary'} className="text-[10px]">
                      {detailListing.seller?.phoneVerifiedAt ? 'Phone Verified' : 'Phone Unverified'}
                    </Badge>
                  </div>
                </div>

                {/* Rejected reason, if applicable */}
                {detailListing.status === 'rejected' && detailListing.rejectedReason && (
                  <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-3 text-sm">
                    <span className="font-semibold text-destructive block mb-0.5">Rejection Reason:</span>
                    <p className="text-foreground">{detailListing.rejectedReason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {historyLoading ? (
                  <div className="flex justify-center p-8"><Spinner /></div>
                ) : !history || history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No moderation history recorded for this listing.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((log: any) => (
                      <div key={log.id} className="border rounded-lg p-3 text-sm bg-muted/5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary capitalize">{log.action.replace('listing.', '').replace(/_/g, ' ')}</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-4">
                          <span>Moderator: <strong className="text-foreground">{log.actor?.displayName || log.actor?.email || 'System'}</strong></span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                        {log.metadata?.reason && (
                          <div className="mt-2 bg-muted/40 p-2 rounded text-xs border border-muted-foreground/10 text-foreground">
                            <span className="font-semibold text-muted-foreground block mb-0.5">Rejection Reason:</span>
                            {String(log.metadata.reason)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Moderation Controls footer */}
            <div className="pt-4 border-t">
              {showRejectForm ? (
                <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-3">
                  <label className="block text-sm font-semibold text-destructive">Enter Rejection Reason</label>
                  <textarea
                    placeholder="Provide a detailed reason explaining why this listing is being rejected..."
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
                <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-3">
                  <p className="text-sm font-semibold text-destructive">Are you sure you want to delete this listing? This action will archive and soft-delete it.</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAction('delete')} disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : 'Yes, Delete Listing'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-2">
                    {detailListing.status !== 'active' && (
                      <Button onClick={() => handleAction('approve')} disabled={actionLoading} size="sm">
                        Approve
                      </Button>
                    )}
                    {detailListing.status !== 'rejected' && (
                      <Button variant="destructive" onClick={() => setShowRejectForm(true)} disabled={actionLoading} size="sm">
                        Reject
                      </Button>
                    )}
                    {detailListing.status !== 'archived' && (
                      <Button variant="outline" onClick={() => handleAction('hide')} disabled={actionLoading} size="sm">
                        Hide
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleAction('feature')} disabled={actionLoading} size="sm">
                      {detailListing.isFeatured ? 'Unfeature Listing' : 'Feature Listing'}
                    </Button>
                    <Button variant="destructive" onClick={() => setDeleteConfirm(true)} disabled={actionLoading} size="sm">
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

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

import { clientGet, clientPost, buildQuery } from '../../lib/clientApi'

import { StatusBadge, formatCurrency, formatDate } from './StatusBadge'
import ReviewListingDrawer from './ReviewListingDrawer'
import { useSocket } from '../../hooks/useSocket'

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
  const [listings, setListings] = useState(Array.isArray(initialData.data) ? initialData.data : [])
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

  // Review drawer
  const [detailListing, setDetailListing] = useState<AdminListing | null>(null)

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
      setListings(Array.isArray(res.data) ? res.data : [])
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch (err) {
      console.error('Failed to load listings:', err)
      setError('Failed to load listings. Please check your connection and try again.')
      setListings([])
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



  useEffect(() => {
    void fetchStatusCounts()
    void fetchData(page, statusFilter, typeFilter, search)
  }, [fetchData, fetchStatusCounts, page, statusFilter, typeFilter, search])

  // Real-time Socket.IO updates
  const socket = useSocket()
  useEffect(() => {
    if (!socket) return

    const handleListingStatusUpdate = (_data: any) => {
      // Refresh listings and status counts when a listing status changes
      void fetchData(page, statusFilter, typeFilter, search)
      void fetchStatusCounts()
    }

    socket.on('listing_status_updated', handleListingStatusUpdate)

    return () => {
      socket.off('listing_status_updated', handleListingStatusUpdate)
    }
  }, [socket, fetchData, page, statusFilter, typeFilter, search, fetchStatusCounts])

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

  const handleReviewComplete = () => {
    setDetailListing(null)
    void fetchData(page, statusFilter, typeFilter, search)
    void fetchStatusCounts()
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

      <ReviewListingDrawer
        listing={detailListing}
        onClose={() => setDetailListing(null)}
        onActionComplete={handleReviewComplete}
      />
    </div>
  )
}

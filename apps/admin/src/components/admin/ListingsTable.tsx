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
} from '@marketplace/ui'
import React, { useState, useCallback } from 'react'

import { clientGet, clientPost, buildQuery } from '../../lib/clientApi'

import { StatusBadge, formatCurrency, formatDate, truncate } from './StatusBadge'

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
  isFeatured: boolean
  primaryImageUrl?: string | null
  seller?: { id: string; displayName?: string; email?: string } | null
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
  const [totalPages, setTotalPages] = useState(initialData.meta.page)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'archive'>('approve')
  const [bulkReason, setBulkReason] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Detail modal
  const [detailListing, setDetailListing] = useState<AdminListing | null>(null)

  const fetchData = useCallback(async (p: number, st: string, q: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<AdminListing>>(
        '/admin/listings' + buildQuery({ page: p, limit: 10, status: st || undefined, search: q || undefined })
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

  const handlePageChange = (p: number) => {
    setPage(p)
    setSelected(new Set())
    void fetchData(p, statusFilter, search)
  }

  const handleFilter = () => {
    setPage(1)
    setSelected(new Set())
    void fetchData(1, statusFilter, search)
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
      void fetchData(page, statusFilter, search)
    } catch {
      setError('Bulk action failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Select
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Active', value: 'active' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'Archived', value: 'archived' },
            ]}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
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
      <div className="rounded-lg border bg-card shadow-sm">
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
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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
                      <img src={listing.primaryImageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No img</div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{truncate(listing.title, 40)}</p>
                      <p className="text-xs text-muted-foreground">{listing.category?.name ?? 'Uncategorized'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{listing.seller?.displayName ?? listing.seller?.email ?? '-'}</p>
                </TableCell>
                <TableCell className="text-sm font-medium">{formatCurrency(listing.price, listing.currency)}</TableCell>
                <TableCell><StatusBadge status={listing.status} domain="listing" /></TableCell>
                <TableCell className="text-sm capitalize">{listing.condition}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(listing.createdAt)}</TableCell>
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
      <Modal open={detailListing !== null} onClose={() => { setDetailListing(null) }} title="Listing Details" size="lg">
        {detailListing && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {detailListing.primaryImageUrl && (
                <img src={detailListing.primaryImageUrl} alt="" className="h-32 w-32 rounded-lg object-cover" />
              )}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">{detailListing.title}</h3>
                <StatusBadge status={detailListing.status} domain="listing" />
                <p className="text-2xl font-bold">{formatCurrency(detailListing.price, detailListing.currency)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Condition:</span>
                <span className="ml-2 capitalize">{detailListing.condition}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Category:</span>
                <span className="ml-2">{detailListing.category?.name ?? 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">City:</span>
                <span className="ml-2">{detailListing.city ?? 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Featured:</span>
                <span className="ml-2">{detailListing.isFeatured ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Seller:</span>
                <span className="ml-2">{detailListing.seller?.displayName ?? detailListing.seller?.email ?? 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Favorites:</span>
                <span className="ml-2">{String(detailListing._count?.favorites ?? 0)}</span>
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground text-sm">Description:</span>
              <p className="mt-1 text-sm text-foreground">{detailListing.description}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Created: {formatDate(detailListing.createdAt)} &middot; Slug: {detailListing.slug}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

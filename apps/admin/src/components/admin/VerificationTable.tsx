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
  Alert,
} from '@marketplace/ui'
import React, { useState, useCallback } from 'react'

import { clientGet, clientPatch, buildQuery } from '../../lib/clientApi'

import { StatusBadge, formatDate } from './StatusBadge'

interface VerificationRequest {
  id: string
  userId: string
  type: string
  status: string
  documentUrl?: string | null
  notes?: string | null
  reviewerNotes?: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; displayName?: string; email?: string } | null
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface VerificationTableProps {
  initialData: PaginatedResponse<VerificationRequest>
}

export default function VerificationTable({ initialData }: VerificationTableProps) {
  const [verifications, setVerifications] = useState(initialData.data)
  const [page, setPage] = useState(initialData.meta.page)
  const [totalPages, setTotalPages] = useState(initialData.meta.totalPages)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  // Review modal
  const [reviewItem, setReviewItem] = useState<VerificationRequest | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async (p: number, st: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<VerificationRequest>>(
        '/admin/verifications' + buildQuery({ page: p, limit: 10, status: st || undefined })
      )
      setVerifications(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load verifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    void fetchData(p, statusFilter)
  }

  const handleFilter = () => {
    setPage(1)
    void fetchData(1, statusFilter)
  }

  const handleReview = async () => {
    if (!reviewItem) return
    setActionLoading(true)
    try {
      await clientPatch('/admin/verifications/' + reviewItem.id, {
        decision,
        ...(reviewNotes ? { notes: reviewNotes } : {}),
      })
      setReviewItem(null)
      setReviewNotes('')
      void fetchData(page, statusFilter)
    } catch {
      setError('Failed to process verification.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleQuickAction = async (id: string, dec: 'approved' | 'rejected') => {
    setActionLoading(true)
    try {
      await clientPatch('/admin/verifications/' + id, { decision: dec })
      void fetchData(page, statusFilter)
    } catch {
      setError('Failed to process verification.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
            ]}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Apply</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-56">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifications.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No verification requests found.
                </TableCell>
              </TableRow>
            )}
            {verifications.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{v.user?.displayName ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{v.user?.email ?? '-'}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize">{v.type.replace(/_/g, ' ')}</TableCell>
                <TableCell><StatusBadge status={v.status} domain="verification" /></TableCell>
                <TableCell>
                  {v.documentUrl ? (
                    <a
                      href={v.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Document
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                <TableCell>
                  {v.status === 'pending' ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => { void handleQuickAction(v.id, 'approved') }}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { void handleQuickAction(v.id, 'rejected') }}>
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => { setReviewItem(v); setDecision('approved') }}>
                        Review
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total requests</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Review Modal */}
      <Modal open={reviewItem !== null} onClose={() => { setReviewItem(null) }} title="Review Verification" size="sm">
        <div className="space-y-4">
          {reviewItem?.documentUrl && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Document:</span>
              <a
                href={reviewItem.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-primary hover:underline"
              >
                View Document
              </a>
            </div>
          )}
          {reviewItem?.notes && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">User Notes:</span>
              <p className="mt-1 text-sm">{reviewItem.notes}</p>
            </div>
          )}
          <Select
            label="Decision"
            options={[
              { label: 'Approve', value: 'approved' },
              { label: 'Reject', value: 'rejected' },
            ]}
            value={decision}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setDecision(e.target.value as 'approved' | 'rejected') }}
          />
          <textarea
            placeholder="Reviewer notes (optional)"
            value={reviewNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setReviewNotes(e.target.value) }}
            className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setReviewItem(null) }}>Cancel</Button>
            <Button onClick={() => { void handleReview() }} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

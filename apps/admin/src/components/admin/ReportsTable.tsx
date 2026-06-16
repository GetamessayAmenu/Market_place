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

import { clientGet, clientPatch, buildQuery } from '../../lib/clientApi'

import { StatusBadge, formatDate, truncate } from './StatusBadge'

interface AdminReport {
  id: string
  reason: string
  description: string
  status: string
  targetType: string
  targetId?: string | null
  reporterId: string
  reportedUserId?: string | null
  listingId?: string | null
  resolution?: string | null
  resolutionNote?: string | null
  createdAt: string
  updatedAt: string
  reporter?: { id: string; displayName?: string; email?: string } | null
  listing?: { id: string; title: string } | null
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface ReportsTableProps {
  initialData: PaginatedResponse<AdminReport>
}

export default function ReportsTable({ initialData }: ReportsTableProps) {
  const [reports, setReports] = useState(initialData.data)
  const [page, setPage] = useState(initialData.meta.page)
  const [totalPages, setTotalPages] = useState(initialData.meta.totalPages)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Resolve modal
  const [resolveReport, setResolveReport] = useState<AdminReport | null>(null)
  const [resolution, setResolution] = useState<'resolved' | 'dismissed'>('resolved')
  const [resolutionNote, setResolutionNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Detail modal
  const [detailReport, setDetailReport] = useState<AdminReport | null>(null)

  const fetchData = useCallback(async (p: number, st: string, tt: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<AdminReport>>(
        '/reports' + buildQuery({ page: p, limit: 10, status: st || undefined, targetType: tt || undefined })
      )
      setReports(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load reports.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    void fetchData(p, statusFilter, typeFilter)
  }

  const handleFilter = () => {
    setPage(1)
    void fetchData(1, statusFilter, typeFilter)
  }

  const handleSetUnderReview = async (id: string) => {
    setActionLoading(true)
    try {
      await clientPatch('/reports/' + id + '/review')
      void fetchData(page, statusFilter, typeFilter)
    } catch {
      setError('Failed to update report.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!resolveReport) return
    setActionLoading(true)
    try {
      await clientPatch('/reports/' + resolveReport.id + '/resolve', {
        resolution,
        ...(resolutionNote ? { resolutionNote } : {}),
      })
      setResolveReport(null)
      setResolutionNote('')
      void fetchData(page, statusFilter, typeFilter)
    } catch {
      setError('Failed to resolve report.')
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
              { label: 'Under Review', value: 'under_review' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Dismissed', value: 'dismissed' },
            ]}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-44">
          <Select
            options={[
              { label: 'All Types', value: '' },
              { label: 'Listing', value: 'listing' },
              { label: 'User', value: 'user' },
              { label: 'Message', value: 'message' },
            ]}
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setTypeFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Apply Filters</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {actionLoading && <div className="flex justify-center p-4"><Spinner size="sm" /></div>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{report.reason}</p>
                    <p className="text-xs text-muted-foreground max-w-xs">{truncate(report.description, 60)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="capitalize">{report.targetType}</span>
                    {report.listing && (
                      <p className="text-xs text-muted-foreground">{report.listing.title}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {report.reporter?.displayName ?? report.reporter?.email ?? '-'}
                </TableCell>
                <TableCell><StatusBadge status={report.status} domain="report" /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(report.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setDetailReport(report) }}>View</Button>
                    {report.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => { void handleSetUnderReview(report.id) }}>Review</Button>
                    )}
                    {(report.status === 'pending' || report.status === 'under_review') && (
                      <Button size="sm" onClick={() => { setResolveReport(report); setResolution('resolved') }}>Resolve</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total reports</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Resolve Modal */}
      <Modal open={resolveReport !== null} onClose={() => { setResolveReport(null) }} title="Resolve Report" size="sm">
        <div className="space-y-4">
          <Select
            label="Resolution"
            options={[
              { label: 'Resolved', value: 'resolved' },
              { label: 'Dismissed', value: 'dismissed' },
            ]}
            value={resolution}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setResolution(e.target.value as 'resolved' | 'dismissed') }}
          />
          <textarea
            placeholder="Resolution note (optional)"
            value={resolutionNote}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setResolutionNote(e.target.value) }}
            className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setResolveReport(null) }}>Cancel</Button>
            <Button onClick={() => { void handleResolve() }} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailReport !== null} onClose={() => { setDetailReport(null) }} title="Report Details" size="lg">
        {detailReport && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{detailReport.reason}</h3>
                <StatusBadge status={detailReport.status} domain="report" className="mt-1" />
              </div>
              <span className="text-xs text-muted-foreground">{detailReport.id.slice(0, 8)}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground text-sm">Description:</span>
              <p className="mt-1 text-sm">{detailReport.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Target Type:</span>
                <span className="ml-2 capitalize">{detailReport.targetType}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Reporter:</span>
                <span className="ml-2">{detailReport.reporter?.displayName ?? detailReport.reporter?.email ?? 'N/A'}</span>
              </div>
              {detailReport.listing && (
                <div>
                  <span className="font-medium text-muted-foreground">Listing:</span>
                  <span className="ml-2">{detailReport.listing.title}</span>
                </div>
              )}
              {detailReport.resolution && (
                <div>
                  <span className="font-medium text-muted-foreground">Resolution:</span>
                  <span className="ml-2 capitalize">{detailReport.resolution}</span>
                </div>
              )}
              {detailReport.resolutionNote && (
                <div className="col-span-2">
                  <span className="font-medium text-muted-foreground">Resolution Note:</span>
                  <p className="mt-1 text-sm">{detailReport.resolutionNote}</p>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Created: {formatDate(detailReport.createdAt)} &middot; Updated: {formatDate(detailReport.updatedAt)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

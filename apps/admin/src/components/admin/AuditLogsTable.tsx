'use client'
import {
  Button,
  Select,
  Pagination,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert,
  Badge,
} from '@marketplace/ui'
import React, { useState, useCallback } from 'react'

import { clientGet, buildQuery } from '../../lib/clientApi'

import { formatDateTime } from './StatusBadge'

interface AuditLog {
  id: string
  actorId: string
  action: string
  resource: string
  resourceId?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface AuditLogsTableProps {
  initialData: PaginatedResponse<AuditLog>
}

export default function AuditLogsTable({ initialData }: AuditLogsTableProps) {
  const [logs, setLogs] = useState(initialData.data)
  const [page, setPage] = useState(initialData.meta.page)
  const [totalPages, setTotalPages] = useState(initialData.meta.totalPages)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [resourceFilter, setResourceFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [actorSearch, setActorSearch] = useState('')

  const fetchData = useCallback(async (p: number, resource: string, action: string, actor: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<AuditLog>>(
        '/admin/audit-logs' + buildQuery({
          page: p,
          limit: 15,
          resource: resource || undefined,
          action: action || undefined,
          actorId: actor || undefined,
        })
      )
      setLogs(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    void fetchData(p, resourceFilter, actionFilter, actorSearch)
  }

  const handleFilter = () => {
    setPage(1)
    void fetchData(1, resourceFilter, actionFilter, actorSearch)
  }

  const getActionColor = (action: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    const a = action.toLowerCase()
    if (a.includes('create') || a.includes('approve')) return 'success'
    if (a.includes('update') || a.includes('review')) return 'info'
    if (a.includes('delete') || a.includes('ban') || a.includes('reject')) return 'error'
    if (a.includes('suspend') || a.includes('flag')) return 'warning'
    return 'secondary'
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            options={[
              { label: 'All Resources', value: '' },
              { label: 'Listing', value: 'listing' },
              { label: 'User', value: 'user' },
              { label: 'Report', value: 'report' },
              { label: 'Verification', value: 'verification' },
              { label: 'Auth', value: 'auth' },
            ]}
            value={resourceFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setResourceFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-40">
          <Select
            options={[
              { label: 'All Actions', value: '' },
              { label: 'Create', value: 'create' },
              { label: 'Update', value: 'update' },
              { label: 'Delete', value: 'delete' },
              { label: 'Approve', value: 'approve' },
              { label: 'Reject', value: 'reject' },
              { label: 'Suspend', value: 'suspend' },
            ]}
            value={actionFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setActionFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-48">
          <input
            type="text"
            placeholder="Actor ID..."
            value={actorSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setActorSearch(e.target.value) }}
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Search</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </TableCell>
                <TableCell className="text-sm font-mono text-xs">{log.actorId.slice(0, 8)}...</TableCell>
                <TableCell>
                  <Badge variant={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm capitalize">{log.resource}</TableCell>
                <TableCell className="text-sm font-mono text-xs text-muted-foreground">
                  {log.resourceId ? log.resourceId.slice(0, 12) + '...' : '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.ipAddress ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total entries</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  )
}

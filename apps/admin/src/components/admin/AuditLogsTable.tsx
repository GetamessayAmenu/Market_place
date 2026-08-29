'use client'

import {
  Alert,
  Badge,
  Button,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@marketplace/ui'
import React, { useCallback, useState } from 'react'

import type { AuditLog } from '../../lib/adminApi'
import { getAuditLogsExportUrl } from '../../lib/adminApi'
import { buildQuery, clientGet } from '../../lib/clientApi'

import AuditLogDetailDrawer from './AuditLogDetailDrawer'
import { formatDateTime } from './StatusBadge'

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface AuditLogsTableProps {
  initialData: PaginatedResponse<AuditLog>
}

export default function AuditLogsTable({ initialData }: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialData?.data ?? [])
  const [page, setPage] = useState(initialData?.meta?.page ?? 1)
  const [totalPages, setTotalPages] = useState(initialData?.meta?.totalPages ?? 1)
  const [total, setTotal] = useState(initialData?.meta?.total ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Drawer state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actorSearch, setActorSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchData = useCallback(
    async (
      p: number,
      resF: string,
      actF: string,
      statF: string,
      actSearch: string,
      srch: string,
      stDate: string,
      eDate: string,
    ) => {
      setLoading(true)
      setError(null)
      try {
        const queryParams = {
          page: p,
          limit: 15,
          resource: resF || undefined,
          action: actF || undefined,
          status: statF || undefined,
          actorId: actSearch || undefined,
          search: srch || undefined,
          startDate: stDate || undefined,
          endDate: eDate || undefined,
        }
        const res = await clientGet<PaginatedResponse<AuditLog>>(
          '/admin/audit-logs' + buildQuery(queryParams),
        )
        setLogs(res.data)
        setTotalPages(res.meta.totalPages)
        setTotal(res.meta.total)
      } catch {
        setError('Failed to load audit logs.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const handlePageChange = (p: number) => {
    setPage(p)
    void fetchData(p, resourceFilter, actionFilter, statusFilter, actorSearch, search, startDate, endDate)
  }

  const handleFilter = () => {
    setPage(1)
    void fetchData(1, resourceFilter, actionFilter, statusFilter, actorSearch, search, startDate, endDate)
  }

  const handleResetFilters = () => {
    setSearch('')
    setResourceFilter('')
    setActionFilter('')
    setStatusFilter('')
    setActorSearch('')
    setStartDate('')
    setEndDate('')
    setPage(1)
    void fetchData(1, '', '', '', '', '', '', '')
  }

  const handleExportCsv = () => {
    const exportUrl = getAuditLogsExportUrl({
      resource: resourceFilter || undefined,
      action: actionFilter || undefined,
      status: statusFilter || undefined,
      actorId: actorSearch || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    window.open(exportUrl, '_blank')
  }

  const getActionBadgeVariant = (action: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    const a = action.toUpperCase()
    if (a.includes('CREATE') || a.includes('APPROVE') || a.includes('SUCCESS')) return 'success'
    if (a.includes('UPDATE') || a.includes('CHANGE')) return 'info'
    if (a.includes('DELETE') || a.includes('BAN') || a.includes('REJECT') || a.includes('FAILED')) return 'error'
    if (a.includes('SUSPEND') || a.includes('RESTRICT')) return 'warning'
    return 'secondary'
  }

  const getStatusBadgeVariant = (status?: string): 'success' | 'error' | 'warning' | 'secondary' => {
    const s = (status || 'SUCCESS').toUpperCase()
    if (s === 'SUCCESS') return 'success'
    if (s === 'FAILURE' || s === 'FAILED') return 'error'
    if (s === 'ATTEMPT') return 'warning'
    return 'secondary'
  }

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Filters bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Free Text Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Search Keywords</label>
            <input
              type="text"
              placeholder="Search actions, users, descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Resource Filter */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Resource</label>
            <Select
              options={[
                { label: 'All Resources', value: '' },
                { label: 'Listing', value: 'LISTING' },
                { label: 'User', value: 'USER' },
                { label: 'Report', value: 'REPORT' },
                { label: 'Order', value: 'ORDER' },
                { label: 'Rental', value: 'RENTAL' },
                { label: 'Custom Order', value: 'CUSTOM_ORDER' },
                { label: 'Chat', value: 'CHAT' },
                { label: 'Verification', value: 'VERIFICATION' },
                { label: 'System Setting', value: 'SYSTEM_SETTING' },
              ]}
              value={resourceFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResourceFilter(e.target.value)}
              size="sm"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Action</label>
            <Select
              options={[
                { label: 'All Actions', value: '' },
                { label: 'Admin Login', value: 'ADMIN_LOGIN_SUCCESS' },
                { label: 'Listing Approved', value: 'LISTING_APPROVED' },
                { label: 'Listing Rejected', value: 'LISTING_REJECTED' },
                { label: 'User Suspended', value: 'USER_SUSPENDED' },
                { label: 'User Reactivated', value: 'USER_REACTIVATED' },
                { label: 'Report Resolved', value: 'REPORT_RESOLVED' },
                { label: 'Message Removed', value: 'MESSAGE_REMOVED' },
                { label: 'Order Status Changed', value: 'ORDER_STATUS_CHANGED' },
              ]}
              value={actionFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActionFilter(e.target.value)}
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Result Status</label>
            <Select
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Success', value: 'SUCCESS' },
                { label: 'Failure', value: 'FAILURE' },
                { label: 'Attempt', value: 'ATTEMPT' },
              ]}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              size="sm"
            />
          </div>

          {/* Actor Search */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Actor ID</label>
            <input
              type="text"
              placeholder="Actor UUID..."
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Date Filters & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button size="sm" onClick={handleFilter}>
              Apply Filters
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCsv}>
              📥 Export CSV
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Date & Time</TableHead>
              <TableHead className="w-48">Actor</TableHead>
              <TableHead className="w-48">Action</TableHead>
              <TableHead className="w-32">Resource</TableHead>
              <TableHead className="w-28">Result</TableHead>
              <TableHead>Description / Metadata</TableHead>
              <TableHead className="w-20 text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading audit trail...
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">No audit logs found</p>
                    <p className="text-xs">Try adjusting search query, filters, or date range.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => handleRowClick(log)}
                  className="cursor-pointer hover:bg-muted/40 transition"
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-foreground truncate max-w-[170px]">
                      {log.actor?.displayName || log.actor?.email || 'System'}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[170px]">
                      {log.actorId.slice(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs capitalize font-medium">
                    {log.resource}
                    {log.resourceId && (
                      <span className="block text-[10px] text-muted-foreground font-mono">
                        #{log.resourceId.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(log.status)}>
                      {log.status || 'SUCCESS'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {log.description || (log.changes ? `Updated ${Object.keys(log.changes).join(', ')}` : JSON.stringify(log.metadata || {}))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(log)
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages >= 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {logs.length} of {total} audit records
          </p>
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </div>
      )}

      {/* Detail Drawer */}
      <AuditLogDetailDrawer
        log={selectedLog}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

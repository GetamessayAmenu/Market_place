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

interface AdminUser {
  id: string
  displayName?: string
  email: string
  status: string
  roles?: string[]
  avatarUrl?: string | null
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
  _count?: { listings: number; reports: number }
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface UsersTableProps {
  initialData: PaginatedResponse<AdminUser>
}

export default function UsersTable({ initialData }: UsersTableProps) {
  const [users, setUsers] = useState(initialData.data)
  const [page, setPage] = useState(initialData.meta.page)
  const [totalPages, setTotalPages] = useState(initialData.meta.totalPages)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Detail / sanction modal
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null)
  const [sanctionModal, setSanctionModal] = useState(false)
  const [newStatus, setNewStatus] = useState('active')
  const [sanctionReason, setSanctionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async (p: number, st: string, q: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<AdminUser>>(
        '/admin/users' + buildQuery({ page: p, limit: 10, status: st || undefined, search: q || undefined })
      )
      setUsers(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    void fetchData(p, statusFilter, search)
  }

  const handleFilter = () => {
    setPage(1)
    void fetchData(1, statusFilter, search)
  }

  const handleSanction = async () => {
    if (!detailUser) return
    setActionLoading(true)
    try {
      await clientPatch('/admin/users/' + detailUser.id, {
        status: newStatus,
        ...(sanctionReason ? { reason: sanctionReason } : {}),
      })
      setSanctionModal(false)
      setSanctionReason('')
      void fetchData(page, statusFilter, search)
    } catch {
      setError('Failed to update user.')
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
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
              { label: 'Banned', value: 'banned' },
            ]}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value) }}
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Apply Filters</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {(user.displayName ?? user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-sm">{user.displayName ?? '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell><StatusBadge status={user.status} domain="user" /></TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {user.roles?.[0] ?? 'user'}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{String(user._count?.listings ?? 0)}</TableCell>
                <TableCell className="text-sm">{String(user._count?.reports ?? 0)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setDetailUser(user) }}>View</Button>
                    <Button size="sm" variant="outline" onClick={() => { setDetailUser(user); setSanctionModal(true); setNewStatus(user.status) }}>
                      Manage
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total users</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={detailUser !== null && !sanctionModal} onClose={() => { setDetailUser(null) }} title="User Details" size="md">
        {detailUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {detailUser.avatarUrl ? (
                <img src={detailUser.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-medium">
                  {(detailUser.displayName ?? detailUser.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{detailUser.displayName ?? 'Unnamed'}</h3>
                <p className="text-sm text-muted-foreground">{detailUser.email}</p>
                <StatusBadge status={detailUser.status} domain="user" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Role:</span>
                <span className="ml-2">{detailUser.roles?.join(', ') ?? 'user'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Listings:</span>
                <span className="ml-2">{String(detailUser._count?.listings ?? 0)}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Reports:</span>
                <span className="ml-2">{String(detailUser._count?.reports ?? 0)}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Email Verified:</span>
                <span className="ml-2">{detailUser.emailVerifiedAt ? formatDate(detailUser.emailVerifiedAt) : 'No'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Phone Verified:</span>
                <span className="ml-2">{detailUser.phoneVerifiedAt ? formatDate(detailUser.phoneVerifiedAt) : 'No'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Joined:</span>
                <span className="ml-2">{formatDate(detailUser.createdAt)}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">ID: {detailUser.id}</div>
          </div>
        )}
      </Modal>

      {/* Sanction Modal */}
      <Modal open={sanctionModal} onClose={() => { setSanctionModal(false) }} title="Manage User Status" size="sm">
        <div className="space-y-4">
          <Select
            label="Status"
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
              { label: 'Banned', value: 'banned' },
            ]}
            value={newStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setNewStatus(e.target.value) }}
          />
          <textarea
            placeholder="Reason for status change (optional)"
            value={sanctionReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setSanctionReason(e.target.value) }}
            className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setSanctionModal(false) }}>Cancel</Button>
            <Button onClick={() => { void handleSanction() }} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

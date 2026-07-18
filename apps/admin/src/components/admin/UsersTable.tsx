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
  Spinner,
} from '@marketplace/ui'
import React, { useState, useCallback } from 'react'

import { clientGet, clientPatch, clientPost, buildQuery } from '../../lib/clientApi'

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
  const [roleFilter, setRoleFilter] = useState('')
  const [verificationFilter, setVerificationFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'activate' | 'suspend' | 'ban' | 'verify_email' | 'verify_phone' | 'change_role'>('activate')
  const [bulkReason, setBulkReason] = useState('')
  const [bulkNewRole, setBulkNewRole] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} })

  // Detail / sanction modal
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null)
  const [sanctionModal, setSanctionModal] = useState(false)
  const [newStatus, setNewStatus] = useState('active')
  const [sanctionReason, setSanctionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Role management modal
  const [roleModal, setRoleModal] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [roleLoading, setRoleLoading] = useState(false)

  const fetchData = useCallback(async (p: number, st: string, rl: string, vf: string, q: string, sb: string, so: 'asc' | 'desc') => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<AdminUser>>(
        '/admin/users' + buildQuery({ 
          page: p, 
          limit: 10, 
          status: st || undefined, 
          role: rl || undefined,
          verification: vf || undefined,
          search: q || undefined,
          sortBy: sb,
          sortOrder: so
        })
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
    setSelected(new Set())
    void fetchData(p, statusFilter, roleFilter, verificationFilter, search, sortBy, sortOrder)
  }

  const handleFilter = () => {
    setPage(1)
    setSelected(new Set())
    void fetchData(1, statusFilter, roleFilter, verificationFilter, search, sortBy, sortOrder)
  }

  const handleSort = (field: string) => {
    const newSortBy = field
    const newSortOrder = sortBy === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    void fetchData(page, statusFilter, roleFilter, verificationFilter, search, newSortBy, newSortOrder)
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
    if (selected.size === users.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(users.map((u) => u.id)))
    }
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
      void fetchData(page, statusFilter, roleFilter, verificationFilter, search, sortBy, sortOrder)
    } catch {
      setError('Failed to update user.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRoleChange = async () => {
    if (!detailUser) return
    setRoleLoading(true)
    try {
      await clientPatch('/admin/users/' + detailUser.id, {
        role: newRole,
      })
      setRoleModal(false)
      setNewRole('')
      void fetchData(page, statusFilter, roleFilter, verificationFilter, search, sortBy, sortOrder)
    } catch {
      setError('Failed to update user role.')
    } finally {
      setRoleLoading(false)
    }
  }

  const handleVerifyEmail = async (userId: string) => {
    try {
      await clientPatch('/admin/users/' + userId, {
        action: 'verify_email',
      })
      void fetchData(page, statusFilter, roleFilter, verificationFilter, search, sortBy, sortOrder)
    } catch {
      setError('Failed to verify email.')
    }
  }

  const handleVerifyPhone = async (userId: string) => {
    try {
      await clientPatch('/admin/users/' + userId, {
        action: 'verify_phone',
      })
      void fetchData(page, statusFilter, roleFilter, verificationFilter, search, sortBy, sortOrder)
    } catch {
      setError('Failed to verify phone.')
    }
  }

  const handleBulkSubmit = async () => {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      await clientPost('/admin/users/bulk-action', {
        userIds: Array.from(selected),
        action: bulkAction,
        ...(bulkReason ? { reason: bulkReason } : {}),
        ...(bulkNewRole ? { newRole: bulkNewRole } : {}),
      })
      setBulkModal(false)
      setBulkReason('')
      setBulkNewRole('')
      setSelected(new Set())
      void fetchData(page, statusFilter, roleFilter, verificationFilter, search, sortBy, sortOrder)
    } catch {
      setError('Bulk action failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm })
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
              { label: 'Inactive', value: 'inactive' },
            ]}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-44">
          <Select
            options={[
              { label: 'All Roles', value: '' },
              { label: 'Buyer', value: 'buyer' },
              { label: 'Seller', value: 'seller' },
              { label: 'Admin', value: 'admin' },
            ]}
            value={roleFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setRoleFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-44">
          <Select
            options={[
              { label: 'All Verification', value: '' },
              { label: 'Email Verified', value: 'email' },
              { label: 'Phone Verified', value: 'phone' },
              { label: 'Fully Verified', value: 'both' },
              { label: 'Unverified', value: 'none' },
            ]}
            value={verificationFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setVerificationFilter(e.target.value) }}
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
        {selected.size > 0 && (
          <Button size="sm" variant="outline" onClick={() => { setBulkModal(true) }}>
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
                  checked={users.length > 0 && selected.size === users.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input"
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('displayName')}>User</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>Email</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('roles')}>Role</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('_count.listings')}>Listings</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('_count.reports')}>Reports</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>Joined</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    onChange={() => { toggleSelect(user.id) }}
                    className="h-4 w-4 rounded border-input"
                  />
                </TableCell>
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
                <TableCell>
                  <div className="flex gap-1">
                    {user.emailVerifiedAt && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Email</span>
                    )}
                    {user.phoneVerifiedAt && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Phone</span>
                    )}
                    {!user.emailVerifiedAt && !user.phoneVerifiedAt && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{String(user._count?.listings ?? 0)}</TableCell>
                <TableCell className="text-sm">{String(user._count?.reports ?? 0)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setDetailUser(user) }}>View</Button>
                    <Button size="sm" variant="outline" onClick={() => { setDetailUser(user); setRoleModal(true); setNewRole(user.roles?.[0] ?? 'user') }}>
                      Role
                    </Button>
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
            <div className="flex gap-2">
              {!detailUser.emailVerifiedAt && (
                <Button size="sm" variant="outline" onClick={() => { void handleVerifyEmail(detailUser.id) }}>
                  Verify Email
                </Button>
              )}
              {!detailUser.phoneVerifiedAt && (
                <Button size="sm" variant="outline" onClick={() => { void handleVerifyPhone(detailUser.id) }}>
                  Verify Phone
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => { setRoleModal(true); setNewRole(detailUser.roles?.[0] ?? 'user') }}>
                  Change Role
                </Button>
            </div>
            <div className="text-xs text-muted-foreground">ID: {detailUser.id}</div>
          </div>
        )}
      </Modal>

      {/* Role Management Modal */}
      <Modal open={roleModal} onClose={() => { setRoleModal(false) }} title="Change User Role" size="sm">
        <div className="space-y-4">
          <Select
            label="Role"
            options={[
              { label: 'Buyer', value: 'buyer' },
              { label: 'Seller', value: 'seller' },
              { label: 'Admin', value: 'admin' },
            ]}
            value={newRole}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setNewRole(e.target.value) }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRoleModal(false) }}>Cancel</Button>
            <Button onClick={() => { void handleRoleChange() }} disabled={roleLoading}>
              {roleLoading ? 'Processing...' : 'Update Role'}
            </Button>
          </div>
        </div>
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
              { label: 'Inactive', value: 'inactive' },
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
            <Button 
              onClick={() => {
                if (newStatus === 'banned' || newStatus === 'suspended') {
                  showConfirmDialog(
                    `Confirm ${newStatus}?`,
                    `Are you sure you want to ${newStatus} this user? This action may affect their access to the platform.`,
                    () => { void handleSanction() }
                  )
                } else {
                  void handleSanction()
                }
              }} 
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Update'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal open={bulkModal} onClose={() => { setBulkModal(false) }} title="Bulk Action" size="sm">
        <div className="space-y-4">
          <Select
            label="Action"
            options={[
              { label: 'Activate', value: 'activate' },
              { label: 'Suspend', value: 'suspend' },
              { label: 'Ban', value: 'ban' },
              { label: 'Verify Email', value: 'verify_email' },
              { label: 'Verify Phone', value: 'verify_phone' },
              { label: 'Change Role', value: 'change_role' },
            ]}
            value={bulkAction}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setBulkAction(e.target.value as any) }}
          />
          {bulkAction === 'change_role' && (
            <Select
              label="New Role"
              options={[
                { label: 'Buyer', value: 'buyer' },
                { label: 'Seller', value: 'seller' },
                { label: 'Admin', value: 'admin' },
              ]}
              value={bulkNewRole}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setBulkNewRole(e.target.value) }}
            />
          )}
          <textarea
            placeholder="Reason (optional)"
            value={bulkReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setBulkReason(e.target.value) }}
            className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setBulkModal(false) }}>Cancel</Button>
            <Button 
              onClick={() => {
                if (bulkAction === 'ban' || bulkAction === 'suspend') {
                  showConfirmDialog(
                    `Confirm Bulk ${bulkAction}?`,
                    `Are you sure you want to ${bulkAction} ${selected.size} user(s)? This action cannot be undone.`,
                    () => { void handleBulkSubmit() }
                  )
                } else {
                  void handleBulkSubmit()
                }
              }} 
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <Modal open={confirmDialog.open} onClose={() => { setConfirmDialog({ ...confirmDialog, open: false }) }} title={confirmDialog.title} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{confirmDialog.message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setConfirmDialog({ ...confirmDialog, open: false }) }}>Cancel</Button>
            <Button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, open: false }) }}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

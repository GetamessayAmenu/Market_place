'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchAdminAccounts,
  fetchRoles,
  fetchAllPermissions,
  fetchSecurityEvents,
  createAdminUser,
  updateAdminUserRoles,
  suspendAdminUser,
  reactivateAdminUser,
  revokeAdminUserSessions,
  resetAdminUserMfa,
  createRole,
  syncRolePermissions,
  type AdminUserDetail,
  type RoleDetail,
  type PermissionGroup,
  type SecurityEventItem,
} from '../../../lib/adminApi'
import { usePermissions } from '../../../hooks/usePermissions'
import { Modal, Button, Input, Badge, Alert, Spinner } from '@marketplace/ui'

export default function AdminManagementPage() {
  const { user: currentUser, isSuperAdmin, can } = usePermissions()

  const [activeTab, setActiveTab] = useState<'admins' | 'roles' | 'security'>('admins')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // ── Admin Users State ────────────────────────────────────────────────────────
  const [admins, setAdmins] = useState<AdminUserDetail[]>([])
  const [totalAdmins, setTotalAdmins] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // ── Roles & Permissions State ───────────────────────────────────────────────
  const [roles, setRoles] = useState<RoleDetail[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<RoleDetail | null>(null)
  const [rolePermissionIds, setRolePermissionIds] = useState<Set<string>>(new Set())

  // ── Security Events State ───────────────────────────────────────────────────
  const [securityEvents, setSecurityEvents] = useState<SecurityEventItem[]>([])
  const [severityFilter, setSeverityFilter] = useState('')

  // ── Modals State ────────────────────────────────────────────────────────────
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [newAdminRole, setNewAdminRole] = useState('platform_admin')
  const [newAdminEnforceMfa, setNewAdminEnforceMfa] = useState(true)

  const [editRoleAdmin, setEditRoleAdmin] = useState<AdminUserDetail | null>(null)
  const [editRoleSlug, setEditRoleSlug] = useState('')

  const [suspendAdmin, setSuspendAdmin] = useState<AdminUserDetail | null>(null)
  const [suspendReason, setSuspendReason] = useState('')

  const [resetMfaAdmin, setResetMfaAdmin] = useState<AdminUserDetail | null>(null)
  const [temporaryRecoveryCodes, setTemporaryRecoveryCodes] = useState<string[] | null>(null)

  const [revokeSessionsAdmin, setRevokeSessionsAdmin] = useState<AdminUserDetail | null>(null)

  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleSlug, setNewRoleSlug] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')

  const [actionSubmitting, setActionSubmitting] = useState(false)

  // ── Data Fetching ───────────────────────────────────────────────────────────
  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetchAdminAccounts({
        page,
        limit: 20,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      if (res && res.data) {
        setAdmins(res.data)
        setTotalAdmins(res.meta?.total ?? res.data.length)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load administrative users.')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, statusFilter])

  const loadRoles = useCallback(async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        fetchRoles(),
        fetchAllPermissions(),
      ])
      setRoles(rolesData)
      setPermissionGroups(permsData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load roles and permissions.')
    }
  }, [])

  const loadSecurityEvents = useCallback(async () => {
    try {
      const res = await fetchSecurityEvents({
        page: 1,
        limit: 50,
        ...(severityFilter ? { severity: severityFilter as 'INFO' | 'WARNING' | 'CRITICAL' } : {}),
      })
      if (res && res.data) {
        setSecurityEvents(res.data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load security logs.')
    }
  }, [severityFilter])

  useEffect(() => {
    if (activeTab === 'admins') {
      loadAdmins()
    } else if (activeTab === 'roles') {
      loadRoles()
    } else if (activeTab === 'security') {
      loadSecurityEvents()
    }
  }, [activeTab, loadAdmins, loadRoles, loadSecurityEvents])

  // ── Admin Actions Handlers ──────────────────────────────────────────────────
  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setActionSubmitting(true)

    try {
      await createAdminUser({
        email: newAdminEmail.trim(),
        displayName: newAdminName.trim(),
        password: newAdminPassword,
        roleSlug: newAdminRole,
        enforceMfa: newAdminEnforceMfa,
      })
      setSuccessMessage(`Administrator ${newAdminEmail} created successfully.`)
      setIsCreateAdminOpen(false)
      setNewAdminEmail('')
      setNewAdminName('')
      setNewAdminPassword('')
      setNewAdminRole('platform_admin')
      loadAdmins()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create admin user.')
    } finally {
      setActionSubmitting(false)
    }
  }

  async function handleUpdateAdminRole(e: React.FormEvent) {
    e.preventDefault()
    if (!editRoleAdmin) return
    setError(null)
    setActionSubmitting(true)

    try {
      await updateAdminUserRoles(editRoleAdmin.id, {
        roleSlug: editRoleSlug,
      })
      setSuccessMessage(`Role for ${editRoleAdmin.displayName} updated to ${editRoleSlug}.`)
      setEditRoleAdmin(null)
      loadAdmins()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update admin role.')
    } finally {
      setActionSubmitting(false)
    }
  }

  async function handleSuspendAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!suspendAdmin) return
    setError(null)
    setActionSubmitting(true)

    try {
      await suspendAdminUser(suspendAdmin.id, { reason: suspendReason.trim() })
      setSuccessMessage(`Account ${suspendAdmin.email} suspended and sessions terminated.`)
      setSuspendAdmin(null)
      setSuspendReason('')
      loadAdmins()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to suspend account.')
    } finally {
      setActionSubmitting(false)
    }
  }

  async function handleReactivateAdmin(admin: AdminUserDetail) {
    setError(null)
    try {
      await reactivateAdminUser(admin.id)
      setSuccessMessage(`Account ${admin.email} reactivated successfully.`)
      loadAdmins()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate account.')
    }
  }

  async function handleRevokeSessions(e: React.FormEvent) {
    e.preventDefault()
    if (!revokeSessionsAdmin) return
    setError(null)
    setActionSubmitting(true)

    try {
      await revokeAdminUserSessions(revokeSessionsAdmin.id)
      setSuccessMessage(`All active sessions for ${revokeSessionsAdmin.displayName} revoked.`)
      setRevokeSessionsAdmin(null)
      loadAdmins()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke sessions.')
    } finally {
      setActionSubmitting(false)
    }
  }

  async function handleResetMfa(e: React.FormEvent) {
    e.preventDefault()
    if (!resetMfaAdmin) return
    setError(null)
    setActionSubmitting(true)

    try {
      const res = await resetAdminUserMfa(resetMfaAdmin.id)
      setTemporaryRecoveryCodes(res.temporaryRecoveryCodes || [])
      setSuccessMessage(`MFA credentials reset for ${resetMfaAdmin.displayName}.`)
      loadAdmins()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset MFA.')
    } finally {
      setActionSubmitting(false)
    }
  }

  // ── Role Permissions Matrix Handlers ────────────────────────────────────────
  function openPermissionsModal(role: RoleDetail) {
    setSelectedRoleForPermissions(role)
    const existing = new Set((role.permissions || []).map((p) => p.id))
    setRolePermissionIds(existing)
  }

  function togglePermission(permId: string) {
    setRolePermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(permId)) {
        next.delete(permId)
      } else {
        next.add(permId)
      }
      return next
    })
  }

  function toggleAllGroupPermissions(group: PermissionGroup) {
    const groupPermIds = group.permissions.map((p) => p.id)
    const allSelected = groupPermIds.every((id) => rolePermissionIds.has(id))

    setRolePermissionIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        groupPermIds.forEach((id) => next.delete(id))
      } else {
        groupPermIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  async function handleSaveRolePermissions() {
    if (!selectedRoleForPermissions) return
    setError(null)
    setActionSubmitting(true)

    try {
      await syncRolePermissions(
        selectedRoleForPermissions.id,
        Array.from(rolePermissionIds),
      )
      setSuccessMessage(`Permissions updated for role ${selectedRoleForPermissions.name}.`)
      setSelectedRoleForPermissions(null)
      loadRoles()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions.')
    } finally {
      setActionSubmitting(false)
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setActionSubmitting(true)

    try {
      await createRole({
        name: newRoleName.trim(),
        slug: newRoleSlug.trim().toLowerCase().replace(/\s+/g, '_'),
        description: newRoleDesc.trim(),
      })
      setSuccessMessage(`Custom role ${newRoleName} created successfully.`)
      setIsCreateRoleOpen(false)
      setNewRoleName('')
      setNewRoleSlug('')
      setNewRoleDesc('')
      loadRoles()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create role.')
    } finally {
      setActionSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Admin Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage administrative personnel, granular RBAC permissions, and security monitoring.
          </p>
        </div>

        {activeTab === 'admins' && can('admins.create') && (
          <Button onClick={() => setIsCreateAdminOpen(true)}>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Administrator
          </Button>
        )}

        {activeTab === 'roles' && can('roles.create') && (
          <Button onClick={() => setIsCreateRoleOpen(true)}>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Custom Role
          </Button>
        )}
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('admins')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition ${
              activeTab === 'admins'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Admin Users ({totalAdmins})
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition ${
              activeTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Roles & Permissions Matrix
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Security & Audit Events
          </button>
        </nav>
      </div>

      {/* ── TAB 1: ADMIN USERS ───────────────────────────────────────────────── */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="platform_admin">Platform Admin</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="content_manager">Content Manager</option>
              <option value="support">Support</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <Button variant="ghost" onClick={loadAdmins} disabled={loading}>
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">MFA Status</th>
                    <th className="px-6 py-4">Sessions</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && admins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <Spinner className="mx-auto h-6 w-6" />
                        <span className="mt-2 block">Loading administrative users...</span>
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No administrative accounts found matching filters.
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="transition hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                              {admin.displayName?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-medium text-foreground">
                                {admin.displayName}
                                {admin.isSuperAdmin && (
                                  <span title="Super Admin Account" className="text-amber-500">
                                    ★
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{admin.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={
                                admin.role === 'super_admin'
                                  ? 'warning'
                                  : admin.role === 'platform_admin'
                                  ? 'info'
                                  : 'secondary'
                              }
                            >
                              {admin.role.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {admin.mfaEnabled ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              MFA Active
                            </span>
                          ) : admin.mfaEnforced ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Enforced (Pending Setup)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Disabled
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-mono font-medium">
                            {admin.activeSessionsCount ?? 0} active
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant={admin.status === 'active' ? 'success' : 'error'}>
                            {admin.status.toUpperCase()}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {can('admins.assign_roles') && (
                              <button
                                onClick={() => {
                                  setEditRoleAdmin(admin)
                                  setEditRoleSlug(admin.role)
                                }}
                                className="rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                              >
                                Edit Role
                              </button>
                            )}

                            {can('admins.suspend') && admin.id !== currentUser?.id && (
                              admin.status === 'active' ? (
                                <button
                                  onClick={() => setSuspendAdmin(admin)}
                                  className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/50"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivateAdmin(admin)}
                                  className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/50"
                                >
                                  Reactivate
                                </button>
                              )
                            )}

                            {can('admins.update') && (
                              <button
                                onClick={() => setResetMfaAdmin(admin)}
                                className="rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                                title="Reset MFA Authenticator"
                              >
                                Reset MFA
                              </button>
                            )}

                            {can('admins.update') && (
                              <button
                                onClick={() => setRevokeSessionsAdmin(admin)}
                                className="rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                                title="Terminate All Sessions"
                              >
                                Revoke Sessions
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ROLES & PERMISSIONS MATRIX ─────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{role.name}</span>
                    {role.isSystem ? (
                      <Badge variant="info">System Role</Badge>
                    ) : (
                      <Badge variant="secondary">Custom</Badge>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{role.slug}</p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {role.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Permissions: {role.slug === 'super_admin' ? 'ALL (Centrally Granted)' : role.permissions?.length ?? 0}</span>
                  </div>

                  {can('roles.assign_permissions') && role.slug !== 'super_admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openPermissionsModal(role)}
                    >
                      Configure Permissions
                    </Button>
                  )}

                  {role.slug === 'super_admin' && (
                    <div className="rounded-xl bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      Unrestricted platform authority
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: SECURITY & AUDIT EVENTS ────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="WARNING">Warnings</option>
                <option value="INFO">Informational</option>
              </select>

              <Button variant="ghost" onClick={loadSecurityEvents}>
                Refresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Immutable security event logs stored in PostgreSQL.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Target User</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {securityEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No security events found.
                      </td>
                    </tr>
                  ) : (
                    securityEvents.map((evt) => (
                      <tr key={evt.id} className="transition hover:bg-muted/30">
                        <td className="px-6 py-4 font-mono text-xs font-medium text-foreground">
                          {evt.eventType}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              evt.severity === 'CRITICAL'
                                ? 'error'
                                : evt.severity === 'WARNING'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {evt.severity}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {evt.actor ? (
                            <div>
                              <p className="font-medium text-foreground">{evt.actor.displayName}</p>
                              <p className="text-muted-foreground">{evt.actor.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System / Anonymous</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {evt.targetUser ? (
                            <div>
                              <p className="font-medium text-foreground">{evt.targetUser.displayName}</p>
                              <p className="text-muted-foreground">{evt.targetUser.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {evt.ipAddress || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              evt.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            {evt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(evt.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE ADMIN ──────────────────────────────────────────────── */}
      <Modal
        open={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
        title="Add New Administrator"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Email Address</label>
            <Input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="admin@habesha.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Display Name</label>
            <Input
              type="text"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="Abebe Bikila"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Initial Password</label>
            <Input
              type="password"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Assigned Role</label>
            <select
              value={newAdminRole}
              onChange={(e) => setNewAdminRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {roles.map((r) => (
                <option key={r.slug} value={r.slug} disabled={r.slug === 'super_admin' && !isSuperAdmin}>
                  {r.name} {r.slug === 'super_admin' && !isSuperAdmin ? '(Super Admin Only)' : ''}
                </option>
              ))}
            </select>
            {newAdminRole === 'super_admin' && (
              <p className="mt-1 text-xs text-amber-600 font-medium">
                Note: Creating a Super Admin grants unrestricted access to all marketplace administration modules.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="enforceMfa"
              checked={newAdminEnforceMfa}
              onChange={(e) => setNewAdminEnforceMfa(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="enforceMfa" className="text-sm font-medium text-foreground">
              Enforce Two-Factor Authentication (MFA Required)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setIsCreateAdminOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionSubmitting}>
              {actionSubmitting ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: EDIT ROLE ─────────────────────────────────────────────────── */}
      <Modal
        open={Boolean(editRoleAdmin)}
        onClose={() => setEditRoleAdmin(null)}
        title={`Change Role: ${editRoleAdmin?.displayName}`}
      >
        <form onSubmit={handleUpdateAdminRole} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Assigning or revoking privileged roles is recorded in immutable security logs.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground">Select New Role</label>
            <select
              value={editRoleSlug}
              onChange={(e) => setEditRoleSlug(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {roles.map((r) => (
                <option key={r.slug} value={r.slug} disabled={r.slug === 'super_admin' && !isSuperAdmin}>
                  {r.name} {r.slug === 'super_admin' && !isSuperAdmin ? '(Super Admin Only)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setEditRoleAdmin(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionSubmitting}>
              {actionSubmitting ? 'Updating...' : 'Save Role Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: SUSPEND ADMIN SAFEGUARD ───────────────────────────────────── */}
      <Modal
        open={Boolean(suspendAdmin)}
        onClose={() => setSuspendAdmin(null)}
        title="Confirm Administrative Account Suspension"
      >
        <form onSubmit={handleSuspendAdmin} className="space-y-4">
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <strong>Warning:</strong> Suspending <strong>{suspendAdmin?.email}</strong> will immediately terminate all active sessions, invalidate cached JWTs, and revoke platform access.
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Reason for Suspension</label>
            <Input
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Inactivity, security compliance check, or role transfer"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setSuspendAdmin(null)}>
              Cancel
            </Button>
            <Button variant="destructive" type="submit" disabled={actionSubmitting || !suspendReason.trim()}>
              {actionSubmitting ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: RESET MFA & RECOVERY CODES ─────────────────────────────────── */}
      <Modal
        open={Boolean(resetMfaAdmin)}
        onClose={() => {
          setResetMfaAdmin(null)
          setTemporaryRecoveryCodes(null)
        }}
        title={`Reset MFA: ${resetMfaAdmin?.displayName}`}
      >
        {temporaryRecoveryCodes ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              MFA authenticator has been reset. The user must reconfigure their authenticator app upon next sign in.
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Temporary Emergency Recovery Codes:</p>
              <p className="text-xs text-muted-foreground mb-2">
                Provide these single-use recovery codes to the administrator securely:
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-3 font-mono text-sm">
                {temporaryRecoveryCodes.map((code, idx) => (
                  <span key={idx} className="rounded bg-background p-1.5 text-center font-bold">
                    {code}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={() => {
                  setResetMfaAdmin(null)
                  setTemporaryRecoveryCodes(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetMfa} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reset the MFA configuration for <strong>{resetMfaAdmin?.email}</strong>? Their active sessions will be terminated and they will receive new recovery codes.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="ghost" type="button" onClick={() => setResetMfaAdmin(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionSubmitting}>
                {actionSubmitting ? 'Resetting...' : 'Confirm MFA Reset'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── MODAL: REVOKE SESSIONS CONFIRMATION ──────────────────────────────── */}
      <Modal
        open={Boolean(revokeSessionsAdmin)}
        onClose={() => setRevokeSessionsAdmin(null)}
        title={`Revoke Active Sessions: ${revokeSessionsAdmin?.displayName}`}
      >
        <form onSubmit={handleRevokeSessions} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will immediately invalidate all device sessions and refresh tokens for <strong>{revokeSessionsAdmin?.email}</strong>, forcing re-authentication.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setRevokeSessionsAdmin(null)}>
              Cancel
            </Button>
            <Button variant="destructive" type="submit" disabled={actionSubmitting}>
              {actionSubmitting ? 'Revoking...' : 'Revoke All Sessions'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: ROLE PERMISSION CONFIGURATION MATRIX ──────────────────────── */}
      <Modal
        open={Boolean(selectedRoleForPermissions)}
        onClose={() => setSelectedRoleForPermissions(null)}
        title={`Permissions: ${selectedRoleForPermissions?.name}`}
        size="lg"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-muted-foreground">
            Select the granular resource actions allowed for this administrative role. Changes take effect across active sessions immediately upon cache invalidation.
          </p>

          {permissionGroups.map((group) => {
            const groupPermIds = group.permissions.map((p) => p.id)
            const allSelected = groupPermIds.every((id) => rolePermissionIds.has(id))
            const someSelected = groupPermIds.some((id) => rolePermissionIds.has(id))

            return (
              <div key={group.resource} className="rounded-xl border border-border p-4 bg-muted/10">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="font-semibold uppercase tracking-wider text-xs text-foreground">
                    {group.resource.replace(/_/g, ' ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAllGroupPermissions(group)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    {allSelected ? 'Deselect All' : someSelected ? 'Select Remaining' : 'Select All'}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.permissions.map((p) => {
                    const checked = rolePermissionIds.has(p.id)
                    return (
                      <label
                        key={p.id}
                        className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer text-xs transition ${
                          checked
                            ? 'border-primary/40 bg-primary/5 text-foreground'
                            : 'border-border text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(p.id)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                        />
                        <div>
                          <p className="font-mono font-medium">{p.action}</p>
                          {p.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{p.description}</p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card py-2">
            <Button variant="ghost" onClick={() => setSelectedRoleForPermissions(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRolePermissions} disabled={actionSubmitting}>
              {actionSubmitting ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: CREATE CUSTOM ROLE ────────────────────────────────────────── */}
      <Modal
        open={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        title="Create Custom Administrative Role"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Role Name</label>
            <Input
              value={newRoleName}
              onChange={(e) => {
                setNewRoleName(e.target.value)
                setNewRoleSlug(e.target.value.toLowerCase().replace(/\s+/g, '_'))
              }}
              placeholder="e.g. Dispute Lead"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Slug Identifier</label>
            <Input
              value={newRoleSlug}
              onChange={(e) => setNewRoleSlug(e.target.value)}
              placeholder="dispute_lead"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Description</label>
            <Input
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              placeholder="Operational scope and responsibility summary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setIsCreateRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionSubmitting}>
              {actionSubmitting ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

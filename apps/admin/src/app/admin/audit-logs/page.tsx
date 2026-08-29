import React from 'react'

import AuditLogsTable from '../../../components/admin/AuditLogsTable'
import { fetchAuditLogs } from '../../../lib/adminApi'

export default async function AuditLogsPage() {
  let initialData
  try {
    initialData = await fetchAuditLogs({ page: 1, limit: 15 })
  } catch {
    initialData = {
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 15, totalPages: 0 },
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs & Security Trail</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Immutable server-side audit trail tracking administrative actions, security events, and business operations.
          </p>
        </div>
      </div>

      {/* Security Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs text-muted-foreground">
        <span className="text-lg">🛡️</span>
        <div>
          <p className="font-semibold text-foreground">Append-Only Immutable Security Infrastructure</p>
          <p className="mt-0.5">
            Audit log records are generated exclusively by trusted backend logic and domain events. Logs cannot be modified or deleted by administrators or public endpoints.
          </p>
        </div>
      </div>

      {/* Main Audit Table */}
      <AuditLogsTable initialData={initialData} />
    </div>
  )
}

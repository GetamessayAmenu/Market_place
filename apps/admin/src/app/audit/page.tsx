import React from 'react'

import AuditLogsTable from '../../components/admin/AuditLogsTable'
import { fetchAuditLogs } from '../../lib/adminApi'
export default async function AuditPage() {

  let initialData
  try {
    initialData = await fetchAuditLogs({ page: 1, limit: 15 })
  } catch {
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 15, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Track all admin actions and system events.</p>
      </div>
      <AuditLogsTable initialData={initialData} />
    </div>
  )
}

import React from 'react'

import ReportsTable from '../../components/admin/ReportsTable'
import { fetchReports } from '../../lib/adminApi'
import { requireAdmin } from '../../lib/authServer'

export default async function ReportsPage() {
  await requireAdmin()

  let initialData
  try {
    initialData = await fetchReports({ page: 1, limit: 10 })
  } catch {
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports Management</h1>
        <p className="text-muted-foreground">Review and resolve user-submitted reports.</p>
      </div>
      <ReportsTable initialData={initialData} />
    </div>
  )
}

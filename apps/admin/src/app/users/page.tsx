import React from 'react'

import UsersTable from '../../components/admin/UsersTable'
import { fetchAdminUsers } from '../../lib/adminApi'
import { requireAdmin } from '../../lib/authServer'

export default async function UsersPage() {
  await requireAdmin()

  let initialData
  try {
    initialData = await fetchAdminUsers({ page: 1, limit: 10 })
  } catch {
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">{initialData.meta.total > 0 ? String(initialData.meta.total) + ' total users' : 'Manage marketplace users'}</p>
        </div>
      </div>
      <UsersTable initialData={initialData} />
    </div>
  )
}

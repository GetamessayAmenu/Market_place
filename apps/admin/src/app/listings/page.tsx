import React from 'react'

import ListingsTable from '../../components/admin/ListingsTable'
import { fetchAdminListings } from '../../lib/adminApi'
import { requireAdmin } from '../../lib/authServer'

export default async function ListingsPage() {
  await requireAdmin()

  let initialData
  try {
    initialData = await fetchAdminListings({ page: 1, limit: 10 })
  } catch {
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listings Moderation</h1>
        <p className="text-muted-foreground">Review and moderate all marketplace listings.</p>
      </div>
      <ListingsTable initialData={initialData} />
    </div>
  )
}

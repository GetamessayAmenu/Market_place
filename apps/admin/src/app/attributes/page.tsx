import React from 'react'

import AttributesTable from '../../components/admin/AttributesTable'
import { fetchAdminAttributes } from '../../lib/adminApi'

export default async function AttributesPage() {
  let initialData
  try {
    initialData = await fetchAdminAttributes({ page: 1, limit: 20 })
  } catch {
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attributes Management</h1>
        <p className="text-muted-foreground">Manage sizes, colors, materials, brands, and custom attributes.</p>
      </div>
      <AttributesTable initialData={initialData} />
    </div>
  )
}

import React from 'react'

import CategoriesTable from '../../components/admin/CategoriesTable'
import { fetchAdminCategories } from '../../lib/adminApi'

export default async function CategoriesPage() {
  let initialData
  try {
    initialData = await fetchAdminCategories({ page: 1, limit: 20 })
  } catch {
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories Management</h1>
        <p className="text-muted-foreground">Manage product, rental, and custom service categories.</p>
      </div>
      <CategoriesTable initialData={initialData} />
    </div>
  )
}

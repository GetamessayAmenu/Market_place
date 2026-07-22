import React from 'react'

import OrdersTable from '../../components/admin/OrdersTable'
import { fetchAdminOrders } from '../../lib/adminApi'

export default async function OrdersPage() {
  let initialData
  try {
    initialData = await fetchAdminOrders({ page: 1, limit: 20 })
  } catch {
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders Monitoring</h1>
        <p className="text-muted-foreground">Monitor product, rental, and custom service orders.</p>
      </div>
      <OrdersTable initialData={initialData} />
    </div>
  )
}

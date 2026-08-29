import React from 'react'

import OrdersTable from '../../components/admin/OrdersTable'
import { fetchAdminOrders } from '../../lib/adminApi'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  let initialData
  let errorMessage = null
  
  try {
    console.log('Fetching admin orders...')
    initialData = await fetchAdminOrders({ page: 1, limit: 20 })
    console.log('Admin orders response:', initialData)
  } catch (error) {
    console.error('Failed to fetch admin orders:', error)
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders Monitoring</h1>
        <p className="text-muted-foreground">Monitor product, rental, and custom service orders.</p>
      </div>
      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Error loading orders:</p>
          <p className="text-sm">{errorMessage}</p>
          <p className="text-xs mt-2">Note: Admin orders require admin or super_admin role permissions.</p>
        </div>
      )}
      <OrdersTable initialData={initialData} />
    </div>
  )
}

import React from 'react'

import VerificationTable from '../../components/admin/VerificationTable'
import { fetchVerifications } from '../../lib/adminApi'

export default async function VerificationPage() {

  let initialData
  try {
    initialData = await fetchVerifications({ page: 1, limit: 10 })
  } catch {
    initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seller Verification</h1>
        <p className="text-muted-foreground">Review and approve seller verification requests.</p>
      </div>
      <VerificationTable initialData={initialData} />
    </div>
  )
}

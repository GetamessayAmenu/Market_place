'use client'

import React from 'react'

import VerificationTable from '../../components/admin/VerificationTable'

export default function VerificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seller Verification</h1>
        <p className="text-muted-foreground">Review and approve seller verification requests.</p>
      </div>
      <VerificationTable />
    </div>
  )
}

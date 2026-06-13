import React from 'react'

import { requireAdmin } from '../../lib/authServer'

export default async function VerificationPage() {
  await requireAdmin()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seller Verification</h1>
        <p className="text-muted-foreground">Review and approve seller verification requests.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Verification Queue</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Review submitted identity documents, approve or reject verification requests, and manage badge status.
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
          Coming Soon
        </span>
      </div>
    </div>
  )
}

import React from 'react'

import { requireAdmin } from '../../lib/authServer'

export default async function ReportsPage() {
  await requireAdmin()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports Management</h1>
        <p className="text-muted-foreground">Review and resolve user-submitted reports.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Reports Queue</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Manage reported users, listings, and messages. Take action on violations and resolve disputes.
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
          Coming Soon
        </span>
      </div>
    </div>
  )
}

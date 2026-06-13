import React from 'react'

import { requireAdmin } from '../../lib/authServer'

export default async function ListingsPage() {
  await requireAdmin()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listings Moderation</h1>
        <p className="text-muted-foreground">Review and moderate all marketplace listings.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Listings Moderation</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Review flagged listings, manage reported content, and ensure marketplace quality standards.
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
          Coming Soon
        </span>
      </div>
    </div>
  )
}

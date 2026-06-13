import React from 'react'

import { requireAdmin } from '../../lib/authServer'

export default async function NotificationsPage() {
  await requireAdmin()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Send announcements and manage push notifications.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Notification Center</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Create and schedule broadcast notifications, manage notification templates, and track delivery metrics.
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
          Coming Soon
        </span>
      </div>
    </div>
  )
}

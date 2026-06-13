import React from 'react'

import { requireAdmin } from '../lib/authServer'
import { serverGet } from '../lib/serverApi'

interface StatCard {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  change?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: { total: number }
}

export default async function DashboardPage() {
  await requireAdmin()

  let stats = { users: 0, sellers: 0, listings: 0, reports: 0 }
  try {
    const res = await serverGet<ApiResponse<typeof stats>>('/admin/stats')
    stats = { ...stats, ...res.data }
  } catch {
    // best effort: try individual endpoints
    try {
      const u = await serverGet<ApiResponse<unknown> & { meta?: { total: number } }>('/users?page=1&limit=1')
      stats.users = u.meta?.total ?? 0
    } catch {
      /* ignore */
    }
    try {
      const l = await serverGet<ApiResponse<unknown> & { meta?: { total: number } }>('/listings?page=1&limit=1')
      stats.listings = l.meta?.total ?? 0
    } catch {
      /* ignore */
    }
  }

  const statCards: StatCard[] = [
    {
      label: 'Total Users',
      value: stats.users,
      color: 'bg-primary/10 text-primary',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
    {
      label: 'Active Sellers',
      value: stats.sellers,
      color: 'bg-success/10 text-success',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
    },
    {
      label: 'Total Listings',
      value: stats.listings,
      color: 'bg-info/10 text-info',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
    },
    {
      label: 'Open Reports',
      value: stats.reports,
      color: 'bg-destructive/10 text-destructive',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the admin panel. Here is an overview of your marketplace.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
              {card.change && (
                <p className="text-xs text-success">{card.change}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-sm">User Verifications</span>
              </div>
              <a href="/verification" className="text-sm font-medium text-primary hover:underline">Review</a>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span className="text-sm">Open Reports</span>
              </div>
              <a href="/reports" className="text-sm font-medium text-primary hover:underline">Review</a>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-info" />
                <span className="text-sm">Flagged Listings</span>
              </div>
              <a href="/listings" className="text-sm font-medium text-primary hover:underline">Review</a>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
          <div className="space-y-2">
            <a href="/users" className="block rounded-md p-2 text-sm hover:bg-accent transition-colors">
              Manage Users
            </a>
            <a href="/listings" className="block rounded-md p-2 text-sm hover:bg-accent transition-colors">
              Moderate Listings
            </a>
            <a href="/analytics" className="block rounded-md p-2 text-sm hover:bg-accent transition-colors">
              View Analytics
            </a>
            <a href="/audit" className="block rounded-md p-2 text-sm hover:bg-accent transition-colors">
              Audit Logs
            </a>
            <a href="/notifications" className="block rounded-md p-2 text-sm hover:bg-accent transition-colors">
              Send Notifications
            </a>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Server</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Realtime Service</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

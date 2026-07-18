import Link from 'next/link'
import React from 'react'

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@marketplace/ui'

import { formatDate, formatDateTime } from './StatusBadge'
import type {
  AdminUser,
  AuditLog,
  DashboardStats,
  TopCategory,
} from '../../lib/adminApi'

interface DashboardOverviewProps {
  stats: DashboardStats
  listingsByStatus: Record<string, number>
  usersByStatus: Record<string, number>
  topCategories: TopCategory[]
  recentUsers: AdminUser[]
  recentActivities: AuditLog[]
  sellersCount: number
  pendingVerifications: number
}

const metricCards = [
  { label: 'Total Users', valueKey: 'users.total', accent: 'bg-primary/10 text-primary' },
  { label: 'Total Sellers', valueKey: 'sellersCount', accent: 'bg-secondary/10 text-secondary' },
  { label: 'Active Listings', valueKey: 'listings.active', accent: 'bg-info/10 text-info' },
  { label: 'Pending Verifications', valueKey: 'pendingVerifications', accent: 'bg-warning/10 text-warning' },
  { label: 'Open Reports', valueKey: 'reports.pending', accent: 'bg-destructive/10 text-destructive' },
  { label: 'Active Conversations', valueKey: 'messaging.conversations', accent: 'bg-success/10 text-success' },
  { label: 'New Listings', valueKey: 'listings.newInRange', accent: 'bg-muted/10 text-foreground' },
  { label: 'Pending Listings', valueKey: 'listings.pending', accent: 'bg-info/10 text-info' },
]

function getValue(stats: DashboardStats, sellersCount: number, pendingVerifications: number, key: string): number {
  switch (key) {
    case 'users.total':
      return stats.users.total
    case 'listings.active':
      return stats.listings.active
    case 'reports.pending':
      return stats.reports.pending
    case 'messaging.conversations':
      return stats.messaging.conversations
    case 'listings.newInRange':
      return stats.listings.newInRange
    case 'listings.pending':
      return stats.listings.pending
    case 'sellersCount':
      return sellersCount
    case 'pendingVerifications':
      return pendingVerifications
    default:
      return 0
  }
}

function formatCardLabel(label: string): string {
  return label
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function StatusBar({ items, accent }: { items: Record<string, number>; accent?: string }) {
  const values = Object.values(items)
  const total = values.reduce((sum, current) => sum + current, 0)
  const max = Math.max(...values, 1)

  return (
    <div className="space-y-3">
      {Object.entries(items).map(([label, value]) => (
        <div key={label} className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="capitalize">{label.replace(/_/g, ' ')}</span>
            <span className="font-semibold text-foreground">{value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-2 rounded-full ${accent ?? 'bg-primary'}`}
              style={{ width: `${Math.round((value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Total {total}</p>
    </div>
  )
}

export default function DashboardOverview({
  stats,
  listingsByStatus,
  usersByStatus,
  topCategories,
  recentUsers,
  recentActivities,
  sellersCount,
  pendingVerifications,
}: DashboardOverviewProps) {
  const topCategoryMax = Math.max(...topCategories.map((category) => category.listingCount), 1)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground">Live marketplace performance and moderation insights.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/analytics" className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50">
              View full analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <div key={metric.label} className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{formatCardLabel(metric.label)}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{getValue(stats, sellersCount, pendingVerifications, metric.valueKey).toLocaleString()}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${metric.accent}`}>
                <span className="text-lg font-semibold">{metric.label.charAt(0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listing Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBar items={listingsByStatus} accent="bg-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBar items={usersByStatus} accent="bg-success" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No category data available.</p>
              ) : (
                topCategories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{category.name}</span>
                      <span className="font-semibold text-foreground">{category.listingCount}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-info"
                        style={{ width: `${Math.round((category.listingCount / topCategoryMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{activity.action}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {activity.resource} • {activity.resourceId ? activity.resourceId.slice(0, 8) + '...' : 'no id'}
                        </p>
                      </div>
                      <Badge variant="secondary">{activity.actorId.slice(0, 6)}</Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Verifications awaiting review</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{pendingVerifications.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Open reports</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{stats.reports.pending.toLocaleString()}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/verification" className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20">
                  Review Verifications
                </Link>
                <Link href="/reports" className="inline-flex items-center justify-center rounded-full bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20">
                  Resolve Reports
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No new users yet.</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.displayName ?? user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'warning' : user.status === 'banned' ? 'error' : 'secondary'}>
                        {statusLabel(user.status)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Operations</h2>
            <p className="text-sm text-muted-foreground">Launch key admin actions directly from the overview.</p>
          </div>
          <div className="grid gap-2 sm:auto-cols-max sm:grid-flow-col">
            <Link href="/verification" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Approve Seller
            </Link>
            <Link href="/listings" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50">
              Review Listings
            </Link>
            <Link href="/notifications" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50">
              Send Announcement
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

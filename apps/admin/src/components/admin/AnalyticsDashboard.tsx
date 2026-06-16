'use client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Button,
  Alert,
  Spinner,
} from '@marketplace/ui'
import React, { useState } from 'react'

import { clientGet, buildQuery } from '../../lib/clientApi'

interface DashboardStats {
  users: { total: number; newInRange: number }
  listings: { total: number; active: number; pending: number; newInRange: number }
  reports: { total: number; pending: number }
  messaging: { conversations: number; messages: number }
}

interface TopCategory {
  id: string
  name: string
  slug: string
  listingCount: number
}

interface AnalyticsDashboardProps {
  initialStats: DashboardStats
  initialListingsByStatus: Record<string, number>
  initialUsersByStatus: Record<string, number>
  initialTopCategories: TopCategory[]
}

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'All time', value: '' },
]

function getDateRange(days: string): { from?: string; to?: string } {
  if (!days) return {}
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - Number(days))
  return { from: from.toISOString(), to: to.toISOString() }
}

export default function AnalyticsDashboard({ initialStats, initialListingsByStatus, initialUsersByStatus, initialTopCategories }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState(initialStats)
  const [listingsByStatus, setListingsByStatus] = useState(initialListingsByStatus)
  const [usersByStatus, setUsersByStatus] = useState(initialUsersByStatus)
  const [topCategories, setTopCategories] = useState(initialTopCategories)
  const [range, setRange] = useState('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const { from, to } = getDateRange(range)
      const qs = buildQuery({ from, to })

      const [newStats, newListings, newUsers, newCats] = await Promise.all([
        clientGet<DashboardStats>('/admin/analytics/dashboard' + qs),
        clientGet<Record<string, number>>('/admin/analytics/listings-by-status'),
        clientGet<Record<string, number>>('/admin/analytics/users-by-status'),
        clientGet<TopCategory[]>('/admin/analytics/top-categories'),
      ])
      setStats(newStats)
      setListingsByStatus(newListings)
      setUsersByStatus(newUsers)
      setTopCategories(newCats)
    } catch {
      setError('Failed to refresh analytics.')
    } finally {
      setLoading(false)
    }
  }

  const maxListingCount = Math.max(...Object.values(listingsByStatus), 1)
  const maxUserCount = Math.max(...Object.values(usersByStatus), 1)
  const maxCatCount = topCategories.length > 0 ? Math.max(...topCategories.map((c) => c.listingCount), 1) : 1

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            label="Date Range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setRange(e.target.value) }}
            size="sm"
          />
        </div>
        <Button size="sm" onClick={() => { void handleRefresh() }} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && <div className="flex justify-center"><Spinner size="sm" /></div>}

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.users.total.toLocaleString()}</p>
            <p className="text-xs text-success mt-1">+{String(stats.users.newInRange)} in range</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.listings.active.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{String(stats.listings.pending)} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{String(stats.reports.pending)}</p>
            <p className="text-xs text-muted-foreground mt-1">{String(stats.reports.total)} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.messaging.messages.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{String(stats.messaging.conversations)} conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Listings by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listings by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(listingsByStatus).length === 0 && (
                <p className="text-sm text-muted-foreground">No data available.</p>
              )}
              {Object.entries(listingsByStatus).map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: String(Math.round((count / maxListingCount) * 100)) + '%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(usersByStatus).length === 0 && (
                <p className="text-sm text-muted-foreground">No data available.</p>
              )}
              {Object.entries(usersByStatus).map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-success"
                      style={{ width: String(Math.round((count / maxUserCount) * 100)) + '%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">No data available.</p>
              )}
              {topCategories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="font-medium">{String(cat.listingCount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-info"
                      style={{ width: String(Math.round((cat.listingCount / maxCatCount) * 100)) + '%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New listings in range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Listings in Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <p className="text-4xl font-bold">{String(stats.listings.newInRange)}</p>
            <div className="text-sm text-muted-foreground">
              <p>Total listings: {String(stats.listings.total)}</p>
              <p>Active: {String(stats.listings.active)} &middot; Pending: {String(stats.listings.pending)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

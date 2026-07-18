import React from 'react'

import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard'
import {
  fetchDashboardStats,
  fetchListingsByStatus,
  fetchUsersByStatus,
  fetchTopCategories,
  type TopCategory,
} from '../../lib/adminApi'
export default async function AnalyticsPage() {

  let stats = { users: { total: 0, newInRange: 0 }, listings: { total: 0, active: 0, pending: 0, newInRange: 0 }, reports: { total: 0, pending: 0 }, messaging: { conversations: 0, messages: 0 } }
  let listingsByStatus: Record<string, number> = {}
  let usersByStatus: Record<string, number> = {}
  let topCategories: TopCategory[] = []

  try {
    const [s, l, u, c] = await Promise.all([
      fetchDashboardStats(),
      fetchListingsByStatus(),
      fetchUsersByStatus(),
      fetchTopCategories(),
    ])
    stats = s
    listingsByStatus = l
    usersByStatus = u
    topCategories = c
  } catch {
    // use defaults
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Marketplace performance metrics and insights.</p>
      </div>
      <AnalyticsDashboard
        initialStats={stats}
        initialListingsByStatus={listingsByStatus}
        initialUsersByStatus={usersByStatus}
        initialTopCategories={topCategories}
      />
    </div>
  )
}

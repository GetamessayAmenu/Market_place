import React from 'react'

import DashboardOverview from '../components/admin/DashboardOverview'
import {
  fetchAdminUsers,
  fetchAuditLogs,
  fetchDashboardStats,
  fetchListingsByStatus,
  fetchTopCategories,
  fetchUsersByStatus,
  fetchVerifications,
  fetchAdminListings,
  PaginatedResponse,
  AdminListing,
} from '../lib/adminApi'

export default async function DashboardPage() {

  let stats = {
    users: { total: 0, newInRange: 0 },
    listings: { total: 0, active: 0, pending: 0, newInRange: 0 },
    reports: { total: 0, pending: 0 },
    messaging: { conversations: 0, messages: 0 },
  }
  let listingsByStatus: Record<string, number> = {}
  let usersByStatus: Record<string, number> = {}
  let topCategories: Array<{ id: string; name: string; slug: string; listingCount: number }> = []
  let recentUsers: Array<{ id: string; displayName?: string; email: string; status: string; createdAt: string }> = []
  let recentActivities: Array<{ id: string; actorId: string; action: string; resource: string; resourceId?: string | null; createdAt: string }> = []
  let sellersCount = 0
  let pendingVerifications = 0
  let pendingListingsData: PaginatedResponse<AdminListing> = { success: true, data: [], meta: { total: 0, page: 1, limit: 5, totalPages: 0 } }

  try {
    const [dashboard, listingsStatus, usersStatus, categories, latestUsers, activityLogs, verifications, pendingListings] = await Promise.all([
      fetchDashboardStats(),
      fetchListingsByStatus(),
      fetchUsersByStatus(),
      fetchTopCategories(),
      fetchAdminUsers({ page: 1, limit: 5 }),
      fetchAuditLogs({ page: 1, limit: 5 }),
      fetchVerifications({ page: 1, limit: 1, status: 'pending' }),
      fetchAdminListings({ page: 1, limit: 5, status: 'pending_review' }),
    ])

    stats = dashboard
    listingsByStatus = listingsStatus
    usersByStatus = usersStatus
    topCategories = categories
    recentUsers = latestUsers.data
    recentActivities = activityLogs.data
    sellersCount = (await fetchAdminUsers({ page: 1, limit: 1, role: 'seller' })).meta.total
    pendingVerifications = verifications.meta.total
    pendingListingsData = pendingListings
  } catch {
    // best effort only: render available data
  }

  return (
    <div className="space-y-6">
      <DashboardOverview
        stats={stats}
        listingsByStatus={listingsByStatus}
        usersByStatus={usersByStatus}
        topCategories={topCategories}
        recentUsers={recentUsers}
        recentActivities={recentActivities}
        sellersCount={sellersCount}
        pendingVerifications={pendingVerifications}
        pendingListingsData={pendingListingsData}
      />
    </div>
  )
}
